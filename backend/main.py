from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from dbsetup import init_db
from auth import hash_password, verify_password, create_token, decode_token

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

VALID_ROLES = ["fleet_manager", "driver", "safety_officer", "financial_analyst"]


# ---------- Schemas ----------
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Auth dependency (use this on protected routes) ----------
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid auth header")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    return payload  # {"user_id": ..., "role": ...}


def require_role(*allowed_roles):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(403, "Not authorized for this action")
        return user
    return checker


# ---------- Routes ----------
@app.post("/auth/signup")
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
    return {"token": token, "user_id": str(result.inserted_id), "role": payload.role}


@app.post("/auth/login")
async def login(payload: LoginRequest):
    user = users_col.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(str(user["_id"]), user["role"])
    return {"token": token, "user_id": str(user["_id"]), "role": user["role"]}


@app.get("/auth/me")
async def me(user=Depends(get_current_user)):
    doc = users_col.find_one({"_id": ObjectId(user["user_id"])})
    return {"name": doc["name"], "email": doc["email"], "role": doc["role"]}


# ---------- Example of a role-protected route (delete/adapt when you build vehicles.py) ----------
@app.post("/vehicles/example-protected")
async def example_only_fleet_manager(user=Depends(require_role("fleet_manager"))):
    return {"message": "Only fleet_manager can hit this route"}
