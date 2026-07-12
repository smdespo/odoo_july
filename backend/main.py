from datetime import date, datetime
from enum import Enum
import csv
import io

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

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
drivers_col = db["drivers"]
trips_col = db["trips"]
maintenance_col = db["maintenance_logs"]
fuel_col = db["fuel_logs"]
expenses_col = db["expenses"]

VALID_ROLES = ["fleet_manager", "driver", "safety_officer", "financial_analyst"]
bearer_scheme = HTTPBearer(auto_error=False)


class VehicleStatus(str, Enum):
    available = "Available"
    on_trip = "On Trip"
    in_shop = "In Shop"
    retired = "Retired"


class DriverStatus(str, Enum):
    available = "Available"
    on_trip = "On Trip"
    off_duty = "Off Duty"
    suspended = "Suspended"


class TripStatus(str, Enum):
    draft = "Draft"
    dispatched = "Dispatched"
    completed = "Completed"
    cancelled = "Cancelled"


class MaintenanceStatus(str, Enum):
    open = "Open"
    closed = "Closed"


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
    max_load_kg: float = Field(..., gt=0, example=750)
    odometer: float = Field(..., ge=0, example=42850)
    acquisition_cost: float = Field(..., ge=0, example=685000)
    status: VehicleStatus = Field(default=VehicleStatus.available)


class DriverRegistration(BaseModel):
    name: str = Field(..., example="Alex Fernandes")
    license_number: str = Field(..., example="MH14-2023-0045821")
    license_category: str = Field(..., example="LMV")
    license_expiry: date = Field(..., example="2027-06-30")
    contact_number: str = Field(..., example="9876543210")
    safety_score: float = Field(default=100, ge=0, le=100)
    status: DriverStatus = Field(default=DriverStatus.available)


class TripCreate(BaseModel):
    source: str = Field(..., example="Pune")
    destination: str = Field(..., example="Mumbai")
    vehicle_id: str
    driver_id: str
    cargo_weight_kg: float = Field(..., gt=0)
    planned_distance_km: float = Field(..., gt=0)


class TripComplete(BaseModel):
    final_odometer: float = Field(..., ge=0)
    fuel_consumed: float = Field(..., ge=0)
    revenue: float = Field(default=0, ge=0)


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    description: str = Field(..., example="Oil change")
    cost: float = Field(default=0, ge=0)


class FuelLogCreate(BaseModel):
    vehicle_id: str
    liters: float = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    log_date: date = Field(default_factory=date.today)


class ExpenseCreate(BaseModel):
    vehicle_id: str
    type: str = Field(..., example="Toll")
    amount: float = Field(..., ge=0)
    expense_date: date = Field(default_factory=date.today)


def serialize_doc(doc: dict) -> dict:
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return doc


def parse_object_id(value: str, label: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
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


def require_role(*allowed_roles):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this action",
            )
        return user

    return checker


def get_vehicle_or_404(vehicle_id: str) -> dict:
    vehicle = vehicles_col.find_one({"_id": parse_object_id(vehicle_id, "vehicle_id")})
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    return vehicle


def get_driver_or_404(driver_id: str) -> dict:
    driver = drivers_col.find_one({"_id": parse_object_id(driver_id, "driver_id")})
    if not driver:
        raise HTTPException(404, "Driver not found")
    return driver


def get_trip_or_404(trip_id: str) -> dict:
    trip = trips_col.find_one({"_id": parse_object_id(trip_id, "trip_id")})
    if not trip:
        raise HTTPException(404, "Trip not found")
    return trip


def get_maintenance_or_404(maintenance_id: str) -> dict:
    record = maintenance_col.find_one({"_id": parse_object_id(maintenance_id, "maintenance_id")})
    if not record:
        raise HTTPException(404, "Maintenance record not found")
    return record


def operational_cost(vehicle_id: str) -> dict:
    fuel_total = sum(item.get("cost", 0) for item in fuel_col.find({"vehicle_id": vehicle_id}))
    maintenance_total = sum(item.get("cost", 0) for item in maintenance_col.find({"vehicle_id": vehicle_id}))
    expense_total = sum(item.get("amount", 0) for item in expenses_col.find({"vehicle_id": vehicle_id}))
    return {
        "fuel_cost": fuel_total,
        "maintenance_cost": maintenance_total,
        "other_expenses": expense_total,
        "total_operational_cost": fuel_total + maintenance_total + expense_total,
    }


@app.get("/")
async def root():
    return {"message": "TransitOps API is running"}


@app.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest):
    if payload.role not in VALID_ROLES:
        raise HTTPException(400, f"role must be one of {VALID_ROLES}")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
    }

    try:
        result = users_col.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(400, "Email already registered") from None

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
    doc = users_col.find_one({"_id": parse_object_id(user["user_id"], "user_id")})
    if not doc:
        raise HTTPException(404, "User not found")
    return {"name": doc["name"], "email": doc["email"], "role": doc["role"]}


@app.post("/vehicles")
async def create_vehicle(payload: VehicleRegistration, user=Depends(require_role("fleet_manager"))):
    vehicle_doc = payload.model_dump(mode="json")
    try:
        result = vehicles_col.insert_one(vehicle_doc)
    except DuplicateKeyError:
        raise HTTPException(400, "Registration number already exists") from None
    return {"message": "Vehicle created successfully", "vehicle_id": str(result.inserted_id)}


@app.get("/vehicles")
async def list_vehicles(user=Depends(get_current_user)):
    return [serialize_doc(vehicle) for vehicle in vehicles_col.find()]


@app.post("/drivers")
async def create_driver(payload: DriverRegistration, user=Depends(require_role("fleet_manager", "safety_officer"))):
    driver_doc = payload.model_dump(mode="json")
    try:
        result = drivers_col.insert_one(driver_doc)
    except DuplicateKeyError:
        raise HTTPException(400, "License number already exists") from None
    return {"message": "Driver created successfully", "driver_id": str(result.inserted_id)}


@app.get("/drivers")
async def list_drivers(user=Depends(get_current_user)):
    return [serialize_doc(driver) for driver in drivers_col.find()]


@app.post("/trips")
async def create_trip(payload: TripCreate, user=Depends(require_role("driver", "fleet_manager"))):
    vehicle = get_vehicle_or_404(payload.vehicle_id)
    driver = get_driver_or_404(payload.driver_id)

    trip_doc = payload.model_dump(mode="json")
    trip_doc.update(
        {
            "status": TripStatus.draft.value,
            "final_odometer": vehicle["odometer"],
            "fuel_consumed": None,
            "revenue": 0,
            "dispatched_at": None,
            "completed_at": None,
            "cancelled_at": None,
        }
    )

    if driver["status"] == DriverStatus.suspended.value:
        raise HTTPException(400, "Driver is suspended")

    result = trips_col.insert_one(trip_doc)
    return {"message": "Trip created", "trip_id": str(result.inserted_id)}


@app.post("/trips/{trip_id}/dispatch")
async def dispatch_trip(trip_id: str, user=Depends(require_role("driver", "fleet_manager"))):
    trip = get_trip_or_404(trip_id)
    if trip["status"] != TripStatus.draft.value:
        raise HTTPException(400, "Only Draft trips can be dispatched")

    vehicle = get_vehicle_or_404(trip["vehicle_id"])
    driver = get_driver_or_404(trip["driver_id"])

    if vehicle["status"] in (VehicleStatus.retired.value, VehicleStatus.in_shop.value):
        raise HTTPException(400, f"Vehicle is {vehicle['status']} and cannot be dispatched")
    if vehicle["status"] == VehicleStatus.on_trip.value:
        raise HTTPException(400, "Vehicle is already on a trip")
    if driver["status"] == DriverStatus.suspended.value:
        raise HTTPException(400, "Driver is suspended")
    if driver["status"] == DriverStatus.on_trip.value:
        raise HTTPException(400, "Driver is already on a trip")
    if driver["license_expiry"] < date.today().isoformat():
        raise HTTPException(400, "Driver license has expired")
    if trip["cargo_weight_kg"] > vehicle["max_load_kg"]:
        raise HTTPException(400, "Cargo weight exceeds vehicle max load")

    trips_col.update_one(
        {"_id": trip["_id"]},
        {"$set": {"status": TripStatus.dispatched.value, "dispatched_at": datetime.utcnow().isoformat()}},
    )
    vehicles_col.update_one({"_id": vehicle["_id"]}, {"$set": {"status": VehicleStatus.on_trip.value}})
    drivers_col.update_one({"_id": driver["_id"]}, {"$set": {"status": DriverStatus.on_trip.value}})
    return {"message": "Trip dispatched"}


@app.post("/trips/{trip_id}/complete")
async def complete_trip(trip_id: str, payload: TripComplete, user=Depends(require_role("driver", "fleet_manager"))):
    trip = get_trip_or_404(trip_id)
    if trip["status"] != TripStatus.dispatched.value:
        raise HTTPException(400, "Only Dispatched trips can be completed")
    if payload.final_odometer < 0:
        raise HTTPException(400, "Final odometer must be non-negative")

    trips_col.update_one(
        {"_id": trip["_id"]},
        {
            "$set": {
                "status": TripStatus.completed.value,
                "final_odometer": payload.final_odometer,
                "fuel_consumed": payload.fuel_consumed,
                "revenue": payload.revenue,
                "completed_at": datetime.utcnow().isoformat(),
            }
        },
    )
    vehicles_col.update_one(
        {"_id": parse_object_id(trip["vehicle_id"], "vehicle_id")},
        {"$set": {"status": VehicleStatus.available.value, "odometer": payload.final_odometer}},
    )
    drivers_col.update_one(
        {"_id": parse_object_id(trip["driver_id"], "driver_id")},
        {"$set": {"status": DriverStatus.available.value}},
    )
    return {"message": "Trip completed"}


@app.post("/trips/{trip_id}/cancel")
async def cancel_trip(trip_id: str, user=Depends(require_role("driver", "fleet_manager"))):
    trip = get_trip_or_404(trip_id)
    if trip["status"] != TripStatus.dispatched.value:
        raise HTTPException(400, "Only Dispatched trips can be cancelled")

    trips_col.update_one(
        {"_id": trip["_id"]},
        {"$set": {"status": TripStatus.cancelled.value, "cancelled_at": datetime.utcnow().isoformat()}},
    )
    vehicles_col.update_one(
        {"_id": parse_object_id(trip["vehicle_id"], "vehicle_id")},
        {"$set": {"status": VehicleStatus.available.value}},
    )
    drivers_col.update_one(
        {"_id": parse_object_id(trip["driver_id"], "driver_id")},
        {"$set": {"status": DriverStatus.available.value}},
    )
    return {"message": "Trip cancelled"}


@app.get("/trips")
async def list_trips(user=Depends(get_current_user)):
    return [serialize_doc(trip) for trip in trips_col.find()]


@app.post("/maintenance")
async def create_maintenance(payload: MaintenanceCreate, user=Depends(require_role("fleet_manager"))):
    vehicle = get_vehicle_or_404(payload.vehicle_id)
    doc = payload.model_dump(mode="json")
    doc.update(
        {
            "status": MaintenanceStatus.open.value,
            "created_at": datetime.utcnow().isoformat(),
            "closed_at": None,
        }
    )
    result = maintenance_col.insert_one(doc)
    vehicles_col.update_one({"_id": vehicle["_id"]}, {"$set": {"status": VehicleStatus.in_shop.value}})
    return {"message": "Maintenance record created, vehicle marked In Shop", "maintenance_id": str(result.inserted_id)}


@app.post("/maintenance/{maintenance_id}/close")
async def close_maintenance(maintenance_id: str, user=Depends(require_role("fleet_manager"))):
    record = get_maintenance_or_404(maintenance_id)
    maintenance_col.update_one(
        {"_id": record["_id"]},
        {"$set": {"status": MaintenanceStatus.closed.value, "closed_at": datetime.utcnow().isoformat()}},
    )

    vehicle = get_vehicle_or_404(record["vehicle_id"])
    if vehicle["status"] != VehicleStatus.retired.value:
        vehicles_col.update_one({"_id": vehicle["_id"]}, {"$set": {"status": VehicleStatus.available.value}})
    return {"message": "Maintenance closed"}


@app.get("/maintenance")
async def list_maintenance(user=Depends(get_current_user)):
    return [serialize_doc(record) for record in maintenance_col.find()]


@app.post("/fuel-logs")
async def create_fuel_log(payload: FuelLogCreate, user=Depends(require_role("fleet_manager", "driver"))):
    get_vehicle_or_404(payload.vehicle_id)
    result = fuel_col.insert_one(payload.model_dump(mode="json"))
    return {"message": "Fuel log recorded", "fuel_log_id": str(result.inserted_id)}


@app.post("/expenses")
async def create_expense(payload: ExpenseCreate, user=Depends(require_role("fleet_manager", "financial_analyst"))):
    get_vehicle_or_404(payload.vehicle_id)
    result = expenses_col.insert_one(payload.model_dump(mode="json"))
    return {"message": "Expense recorded", "expense_id": str(result.inserted_id)}


@app.get("/vehicles/{vehicle_id}/operational-cost")
async def get_operational_cost(vehicle_id: str, user=Depends(get_current_user)):
    get_vehicle_or_404(vehicle_id)
    return operational_cost(vehicle_id)


@app.get("/reports/fuel-efficiency/{vehicle_id}")
async def fuel_efficiency(vehicle_id: str, user=Depends(get_current_user)):
    get_vehicle_or_404(vehicle_id)
    trips = list(trips_col.find({"vehicle_id": vehicle_id, "status": TripStatus.completed.value}))
    total_distance = sum(trip.get("planned_distance_km") or 0 for trip in trips)
    total_fuel = sum(trip.get("fuel_consumed") or 0 for trip in trips)
    efficiency = (total_distance / total_fuel) if total_fuel > 0 else 0
    return {
        "vehicle_id": vehicle_id,
        "distance_km": total_distance,
        "fuel_liters": total_fuel,
        "efficiency_km_per_liter": round(efficiency, 2),
    }


@app.get("/reports/fleet-utilization")
async def fleet_utilization(user=Depends(get_current_user)):
    total = vehicles_col.count_documents({})
    on_trip = vehicles_col.count_documents({"status": VehicleStatus.on_trip.value})
    utilization = (on_trip / total * 100) if total > 0 else 0
    return {
        "total_vehicles": total,
        "on_trip": on_trip,
        "fleet_utilization_percent": round(utilization, 2),
    }


@app.get("/reports/roi/{vehicle_id}")
async def vehicle_roi(vehicle_id: str, user=Depends(get_current_user)):
    vehicle = get_vehicle_or_404(vehicle_id)
    costs = operational_cost(vehicle_id)
    revenue = sum(
        trip.get("revenue") or 0
        for trip in trips_col.find({"vehicle_id": vehicle_id, "status": TripStatus.completed.value})
    )
    acquisition_cost = vehicle["acquisition_cost"]
    roi = ((revenue - costs["total_operational_cost"]) / acquisition_cost) if acquisition_cost > 0 else 0
    return {
        "vehicle_id": vehicle_id,
        "revenue": revenue,
        "maintenance_cost": costs["maintenance_cost"],
        "fuel_cost": costs["fuel_cost"],
        "other_expenses": costs["other_expenses"],
        "acquisition_cost": acquisition_cost,
        "roi": round(roi, 4),
    }


@app.get("/reports/export/operational-cost")
async def export_operational_cost_csv(user=Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "vehicle_id",
        "registration_number",
        "fuel_cost",
        "maintenance_cost",
        "other_expenses",
        "total_operational_cost",
    ])

    for vehicle in vehicles_col.find():
        vehicle_id = str(vehicle["_id"])
        costs = operational_cost(vehicle_id)
        writer.writerow(
            [
                vehicle_id,
                vehicle["registration_number"],
                costs["fuel_cost"],
                costs["maintenance_cost"],
                costs["other_expenses"],
                costs["total_operational_cost"],
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=operational_cost_report.csv"},
    )

