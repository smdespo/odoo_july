from datetime import date, datetime
from enum import Enum
from math import exp
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


class FuelPredictionRequest(BaseModel):
    vehicle_type: str = Field(..., example="Truck")
    fuel_type: str = Field(..., example="Diesel")
    vehicle_age_years: int = Field(..., ge=0, le=30, example=5)
    average_mileage_kmpl: float = Field(..., gt=0, example=6.5)
    trip_distance_km: float = Field(..., gt=0, example=450)
    max_capacity_kg: float = Field(..., gt=0, example=5000)
    cargo_weight_kg: float = Field(..., ge=0, example=1200)
    traffic_level: str = Field(..., example="Medium")
    road_type: str = Field(..., example="Mixed")
    ac_on: bool = Field(default=False)


class RepairPredictionRequest(BaseModel):
    vehicle_type: str = Field(..., example="Truck")
    vehicle_age_years: int = Field(..., ge=0, le=30, example=5)
    odometer_km: float = Field(..., ge=0, example=180000)
    maintenance_count: int = Field(..., ge=0, example=6)
    repair_type: str = Field(..., example="Engine Repair")
    severity: str = Field(..., example="Medium")
    parts_available: bool = Field(default=True)
    technician_experience_years: int = Field(..., ge=0, le=40, example=8)
    workshop_load_active_jobs: int = Field(..., ge=0, le=100, example=4)


class BreakdownPredictionRequest(BaseModel):
    age_years: int = Field(..., ge=0, le=30, example=6)
    odometer_km: float = Field(..., ge=0, example=220000)
    trips_completed: int = Field(..., ge=0, example=800)
    fuel_efficiency_kmpl: float = Field(..., gt=0, example=3.2)
    maintenance_count: int = Field(..., ge=0, example=7)
    average_load_percent: float = Field(..., ge=0, le=100, example=75)
    average_trip_distance_km: float = Field(..., ge=0, example=300)
    engine_temperature_c: float = Field(..., ge=0, example=94.5)
    tire_health_percent: float = Field(..., ge=0, le=100, example=55)


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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload


def require_role(*allowed_roles):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this action")
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


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))


def normalize(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    return clamp((value - low) / (high - low), 0.0, 1.0)


def sigmoid(value: float) -> float:
    return 1 / (1 + exp(-value))


def recommend_breakdown_actions(probability: float, engine_temperature_c: float, tire_health_percent: float) -> list[str]:
    recommendations: list[str] = []
    if probability >= 0.75:
        recommendations.append("Schedule immediate inspection before next dispatch")
    elif probability >= 0.55:
        recommendations.append("Move vehicle into preventive maintenance queue")
    else:
        recommendations.append("Vehicle can remain operational with standard checks")

    if engine_temperature_c >= 98:
        recommendations.append("Inspect cooling system and engine load profile")
    if tire_health_percent <= 45:
        recommendations.append("Prioritize tire replacement or balancing")
    if len(recommendations) == 1:
        recommendations.append("Review fuel efficiency and trip pattern during next audit")
    return recommendations


def fuel_prediction_logic(payload: FuelPredictionRequest) -> dict:
    traffic_factor = {"low": 1.0, "medium": 0.9, "high": 0.76}.get(payload.traffic_level.strip().lower(), 0.88)
    road_factor = {"highway": 1.04, "city": 0.84, "mixed": 0.93, "hilly": 0.72, "rural": 0.89}.get(payload.road_type.strip().lower(), 0.9)
    fuel_factor = {"diesel": 1.0, "petrol": 0.94, "gasoline": 0.94, "cng": 0.9, "electric": 1.18, "hybrid": 1.08}.get(payload.fuel_type.strip().lower(), 0.97)
    price_per_liter = {"diesel": 92, "petrol": 105, "gasoline": 105, "cng": 82, "electric": 18, "hybrid": 99}.get(payload.fuel_type.strip().lower(), 95)

    load_ratio = clamp(payload.cargo_weight_kg / payload.max_capacity_kg, 0, 1.35)
    age_penalty = 1 - min(payload.vehicle_age_years * 0.012, 0.22)
    ac_penalty = 0.93 if payload.ac_on else 1.0

    adjusted_mileage = payload.average_mileage_kmpl * traffic_factor * road_factor * fuel_factor * age_penalty * ac_penalty
    adjusted_mileage *= 1 - min(load_ratio * 0.22, 0.24)
    adjusted_mileage = max(adjusted_mileage, 1.25)

    liters = payload.trip_distance_km / adjusted_mileage
    buffer_liters = liters * (0.08 if payload.traffic_level.strip().lower() == "high" else 0.05)
    estimated_cost = (liters + buffer_liters) * price_per_liter

    return {
        "predicted_fuel_required_liters": round(liters, 2),
        "recommended_buffer_liters": round(buffer_liters, 2),
        "adjusted_mileage_kmpl": round(adjusted_mileage, 2),
        "estimated_cost_inr": round(estimated_cost, 2),
        "load_factor_percent": round(load_ratio * 100, 1),
        "advisory": "High traffic and heavy load are reducing route efficiency" if traffic_factor < 0.8 or load_ratio > 0.8 else "Predicted fuel demand is within a normal operating band",
    }


def repair_prediction_logic(payload: RepairPredictionRequest) -> dict:
    repair_base_hours = {
        "engine repair": 18,
        "engine overhaul": 26,
        "transmission service": 12,
        "brake replacement": 6,
        "electrical diagnostics": 7,
        "suspension work": 9,
        "battery and charging": 5,
        "body work": 10,
    }
    severity_factor = {"low": 0.8, "medium": 1.0, "high": 1.32, "critical": 1.65}.get(payload.severity.strip().lower(), 1.0)

    base = repair_base_hours.get(payload.repair_type.strip().lower(), 8)
    odometer_factor = 1 + normalize(payload.odometer_km, 0, 500000) * 0.32
    age_factor = 1 + normalize(payload.vehicle_age_years, 0, 15) * 0.18
    maintenance_factor = 1 + normalize(payload.maintenance_count, 0, 20) * 0.16
    parts_factor = 0.88 if payload.parts_available else 1.28
    technician_factor = 1 - normalize(payload.technician_experience_years, 0, 18) * 0.18
    workshop_factor = 1 + normalize(payload.workshop_load_active_jobs, 0, 20) * 0.26

    predicted_hours = base * severity_factor * odometer_factor * age_factor * maintenance_factor * parts_factor * technician_factor * workshop_factor
    turnaround = "Same-day" if predicted_hours <= 8 else "Next-day" if predicted_hours <= 16 else "Multi-day"

    return {
        "predicted_repair_time_hours": round(predicted_hours, 2),
        "turnaround_band": turnaround,
        "service_window": "Allocate dedicated bay and technician" if predicted_hours >= 16 else "Can fit into standard workshop queue",
        "risk_note": "Parts availability is the main schedule driver" if not payload.parts_available else "Workshop load and severity are the main schedule drivers",
    }


def breakdown_prediction_logic(payload: BreakdownPredictionRequest) -> dict:
    score = 0.0
    score += normalize(payload.age_years, 0, 15) * 0.12
    score += normalize(payload.odometer_km, 0, 500000) * 0.18
    score += normalize(payload.trips_completed, 0, 2500) * 0.1
    score += (1 - normalize(payload.fuel_efficiency_kmpl, 2, 12)) * 0.1
    score += normalize(payload.maintenance_count, 0, 24) * 0.12
    score += normalize(payload.average_load_percent, 0, 100) * 0.08
    score += normalize(payload.average_trip_distance_km, 0, 1000) * 0.08
    score += normalize(payload.engine_temperature_c, 75, 110) * 0.14
    score += (1 - normalize(payload.tire_health_percent, 0, 100)) * 0.08

    probability = clamp(sigmoid((score - 0.52) * 5.5), 0.02, 0.98)
    risk_level = "High" if probability >= 0.75 else "Moderate" if probability >= 0.55 else "Low"

    return {
        "breakdown_predicted": probability >= 0.55,
        "breakdown_probability": round(probability, 4),
        "risk_level": risk_level,
        "recommendations": recommend_breakdown_actions(probability, payload.engine_temperature_c, payload.tire_health_percent),
        "drivers": {
            "engine_temperature_c": payload.engine_temperature_c,
            "tire_health_percent": payload.tire_health_percent,
            "maintenance_count": payload.maintenance_count,
        },
    }


def estimate_vehicle_age_years(vehicle: dict) -> int:
    odometer = float(vehicle.get("odometer") or 0)
    return int(round(clamp(odometer / 35000, 1, 14)))


def estimate_breakdown_payload_from_vehicle(vehicle: dict) -> BreakdownPredictionRequest:
    vehicle_id = str(vehicle["_id"])
    trips = list(trips_col.find({"vehicle_id": vehicle_id}))
    completed_trips = [trip for trip in trips if trip.get("status") == TripStatus.completed.value]
    maintenance_count = maintenance_col.count_documents({"vehicle_id": vehicle_id})
    avg_distance = sum((trip.get("planned_distance_km") or 0) for trip in trips) / len(trips) if trips else 180
    avg_load_ratio = 0.0
    if trips:
        max_load = float(vehicle.get("max_load_kg") or 1)
        avg_load_ratio = sum((trip.get("cargo_weight_kg") or 0) / max_load for trip in trips) / len(trips)
    total_distance = sum((trip.get("planned_distance_km") or 0) for trip in completed_trips)
    total_fuel = sum((trip.get("fuel_consumed") or 0) for trip in completed_trips)
    efficiency = (total_distance / total_fuel) if total_fuel > 0 else max(4.5, 9 - estimate_vehicle_age_years(vehicle) * 0.22)

    status_value = vehicle.get("status", VehicleStatus.available.value)
    engine_temp = 98 if status_value == VehicleStatus.in_shop.value else 93 if status_value == VehicleStatus.on_trip.value else 88
    tire_health = clamp(88 - estimate_vehicle_age_years(vehicle) * 3 - maintenance_count * 1.2, 35, 92)

    return BreakdownPredictionRequest(
        age_years=estimate_vehicle_age_years(vehicle),
        odometer_km=float(vehicle.get("odometer") or 0),
        trips_completed=len(completed_trips),
        fuel_efficiency_kmpl=round(efficiency, 2),
        maintenance_count=maintenance_count,
        average_load_percent=round(clamp(avg_load_ratio * 100, 10, 100), 2),
        average_trip_distance_km=round(avg_distance, 2),
        engine_temperature_c=engine_temp,
        tire_health_percent=round(tire_health, 2),
    )

@app.get("/")
async def root():
    return {
        "message": "TransitOps API is running",
        "features": ["auth", "vehicles", "drivers", "trips", "maintenance", "reports", "ml_predictions"],
    }


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
    return {"access_token": token, "token_type": "bearer", "user_id": str(result.inserted_id), "role": payload.role}


@app.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = users_col.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(str(user["_id"]), user["role"])
    return {"access_token": token, "token_type": "bearer", "user_id": str(user["_id"]), "role": user["role"]}


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

    trips_col.update_one(
        {"_id": trip["_id"]},
        {"$set": {"status": TripStatus.completed.value, "final_odometer": payload.final_odometer, "fuel_consumed": payload.fuel_consumed, "revenue": payload.revenue, "completed_at": datetime.utcnow().isoformat()}},
    )
    vehicles_col.update_one({"_id": parse_object_id(trip["vehicle_id"], "vehicle_id")}, {"$set": {"status": VehicleStatus.available.value, "odometer": payload.final_odometer}})
    drivers_col.update_one({"_id": parse_object_id(trip["driver_id"], "driver_id")}, {"$set": {"status": DriverStatus.available.value}})
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
    vehicles_col.update_one({"_id": parse_object_id(trip["vehicle_id"], "vehicle_id")}, {"$set": {"status": VehicleStatus.available.value}})
    drivers_col.update_one({"_id": parse_object_id(trip["driver_id"], "driver_id")}, {"$set": {"status": DriverStatus.available.value}})
    return {"message": "Trip cancelled"}


@app.get("/trips")
async def list_trips(user=Depends(get_current_user)):
    return [serialize_doc(trip) for trip in trips_col.find()]


@app.post("/maintenance")
async def create_maintenance(payload: MaintenanceCreate, user=Depends(require_role("fleet_manager"))):
    vehicle = get_vehicle_or_404(payload.vehicle_id)
    doc = payload.model_dump(mode="json")
    doc.update({"status": MaintenanceStatus.open.value, "created_at": datetime.utcnow().isoformat(), "closed_at": None})
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
    return {"vehicle_id": vehicle_id, "distance_km": total_distance, "fuel_liters": total_fuel, "efficiency_km_per_liter": round(efficiency, 2)}


@app.get("/reports/fleet-utilization")
async def fleet_utilization(user=Depends(get_current_user)):
    total = vehicles_col.count_documents({})
    on_trip = vehicles_col.count_documents({"status": VehicleStatus.on_trip.value})
    utilization = (on_trip / total * 100) if total > 0 else 0
    return {"total_vehicles": total, "on_trip": on_trip, "fleet_utilization_percent": round(utilization, 2)}


@app.get("/reports/roi/{vehicle_id}")
async def vehicle_roi(vehicle_id: str, user=Depends(get_current_user)):
    vehicle = get_vehicle_or_404(vehicle_id)
    costs = operational_cost(vehicle_id)
    revenue = sum(trip.get("revenue") or 0 for trip in trips_col.find({"vehicle_id": vehicle_id, "status": TripStatus.completed.value}))
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
    writer.writerow(["vehicle_id", "registration_number", "fuel_cost", "maintenance_cost", "other_expenses", "total_operational_cost"])

    for vehicle in vehicles_col.find():
        vehicle_id = str(vehicle["_id"])
        costs = operational_cost(vehicle_id)
        writer.writerow([vehicle_id, vehicle["registration_number"], costs["fuel_cost"], costs["maintenance_cost"], costs["other_expenses"], costs["total_operational_cost"]])

    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=operational_cost_report.csv"})


@app.post("/ml/predict/fuel-consumption")
async def predict_fuel_consumption(payload: FuelPredictionRequest, user=Depends(require_role("fleet_manager", "driver", "financial_analyst"))):
    return fuel_prediction_logic(payload)


@app.post("/ml/predict/repair-time")
async def predict_repair_time(payload: RepairPredictionRequest, user=Depends(require_role("fleet_manager", "safety_officer"))):
    return repair_prediction_logic(payload)


@app.post("/ml/predict/breakdown-risk")
async def predict_breakdown_risk(payload: BreakdownPredictionRequest, user=Depends(require_role("fleet_manager", "safety_officer"))):
    return breakdown_prediction_logic(payload)


@app.get("/ml/fleet-risk-scan")
async def fleet_risk_scan(user=Depends(require_role("fleet_manager", "safety_officer"))):
    records = []
    for vehicle in vehicles_col.find():
        payload = estimate_breakdown_payload_from_vehicle(vehicle)
        risk = breakdown_prediction_logic(payload)
        records.append(
            {
                "vehicle_id": str(vehicle["_id"]),
                "registration_number": vehicle["registration_number"],
                "vehicle_type": vehicle.get("type"),
                "current_status": vehicle.get("status"),
                "breakdown_probability": risk["breakdown_probability"],
                "risk_level": risk["risk_level"],
                "breakdown_predicted": risk["breakdown_predicted"],
                "derived_inputs": payload.model_dump(),
            }
        )

    records.sort(key=lambda item: item["breakdown_probability"], reverse=True)
    high_risk = [item for item in records if item["breakdown_probability"] >= 0.55]
    return {"vehicles_scanned": len(records), "high_risk_count": len(high_risk), "items": records[:10]}
