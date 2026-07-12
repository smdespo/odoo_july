import httpClient from "./httpClient";
import { USE_MOCK, mockDelay } from "./config";
import { vehicles } from "../data/mockData";

// Contract: GET /vehicles -> Vehicle[]
export async function getVehicles() {
  if (USE_MOCK) {
    await mockDelay();
    return [...vehicles];
  }
  const { data } = await httpClient.get("/vehicles");
  return data;
}

// Contract: POST /vehicles -> Vehicle
export async function createVehicle(payload) {
  if (USE_MOCK) {
    await mockDelay();
    const newVehicle = { id: `V-${Date.now()}`, status: "Available", ...payload };
    vehicles.push(newVehicle);
    return newVehicle;
  }
  const { data } = await httpClient.post("/vehicles", payload);
  return data;
}

// Contract: PATCH /vehicles/:id -> Vehicle
export async function updateVehicle(id, changes) {
  if (USE_MOCK) {
    await mockDelay();
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Vehicle not found");
    vehicles[idx] = { ...vehicles[idx], ...changes };
    return vehicles[idx];
  }
  const { data } = await httpClient.patch(`/vehicles/${id}`, changes);
  return data;
}

// Contract: DELETE /vehicles/:id -> 204
// We soft-delete by marking Retired, since vehicles are historical records
// (trips/maintenance reference them) rather than rows to truly remove.
export async function retireVehicle(id) {
  if (USE_MOCK) {
    await mockDelay();
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Vehicle not found");
    vehicles[idx].status = "Retired";
    return vehicles[idx];
  }
  const { data } = await httpClient.delete(`/vehicles/${id}`);
  return data;
}