from typing import Literal

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from auth import create_token, decode_token, hash_password, verify_password
from dbsetup import init_db

app = FastAPI(title="TransitOps API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client, db = init_db()
users_col = db["users"]
vehicles_col = db["vehicles"]

VALID_ROLES = ["fleet_manager", "driver", "safety_officer", "financial_analyst"]
bearer_scheme = HTTPBearer(auto_error=False)


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class VehicleRegistration(BaseModel):
    registration_number: str = Field(..., example="MH12AB4587")
    model: str = Field(..., example="Tata Ace Gold")
    type: str = Field(..., example="Mini Truck")
    max_load_kg: float = Field(..., example=750)
    odometer: float = Field(..., example=42850)
    acquisition_cost: float = Field(..., example=685000)
    status: Literal["Available", "On Trip", "In Shop", "Retired"] = Field(default="Available")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


@app.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest):
    if payload.role not in VALID_ROLES:
        raise HTTPException(400, f"role must be one of {VALID_ROLES}")

    if users_col.find_one({"email": payload.email}):
        raise HTTPException(400, "Email already registered")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
    }
    result = users_col.insert_one(user_doc)
    token = create_token(str(result.inserted_id), payload.role)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(result.inserted_id),
        "role": payload.role,
    }


@app.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = users_col.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(str(user["_id"]), user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "role": user["role"],
    }


@app.get("/auth/me")
async def me(user=Depends(get_current_user)):
    doc = users_col.find_one({"_id": ObjectId(user["user_id"])})
    if not doc:
        raise HTTPException(404, "User not found")

    return {"name": doc["name"], "email": doc["email"], "role": doc["role"]}


@app.post("/vehicles")
async def create_vehicle(payload: VehicleRegistration, user=Depends(get_current_user)):
    existing_vehicle = vehicles_col.find_one({"registration_number": payload.registration_number})
    if existing_vehicle:
        raise HTTPException(400, "Registration number already exists")

    vehicle_doc = payload.model_dump()
    result = vehicles_col.insert_one(vehicle_doc)
    return {"message": "Vehicle created successfully", "vehicle_id": str(result.inserted_id)}
