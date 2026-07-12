import httpClient from "./httpClient";
import { USE_MOCK, mockDelay } from "./config";
import { trips, vehicles, drivers } from "../data/mockData";

// Contract: GET /trips -> Trip[]
export async function getTrips() {
  if (USE_MOCK) {
    await mockDelay();
    return [...trips];
  }
  const { data } = await httpClient.get("/trips");
  return data;
}

// Contract: POST /trips -> Trip (status: Draft)
export async function createTrip(payload) {
  if (USE_MOCK) {
    await mockDelay();
    const newTrip = {
      id: `TR${String(trips.length + 1).padStart(3, "0")}`,
      status: "Draft",
      vehicleId: null,
      driverId: null,
      ...payload,
    };
    trips.push(newTrip);
    return newTrip;
  }
  const { data } = await httpClient.post("/trips", payload);
  return data;
}

function setVehicleStatus(vehicleId, status) {
  const v = vehicles.find((v) => v.id === vehicleId);
  if (v) v.status = status;
}

function setDriverStatus(driverId, status) {
  const d = drivers.find((d) => d.id === driverId);
  if (d) d.status = status;
}

// Contract: PATCH /trips/:id/dispatch { vehicleId, driverId } -> Trip
// Side effect: flips vehicle + driver to "On Trip"
export async function dispatchTrip(id, { vehicleId, driverId }) {
  if (USE_MOCK) {
    await mockDelay();
    const trip = trips.find((t) => t.id === id);
    if (!trip) throw new Error("Trip not found");
    trip.vehicleId = vehicleId;
    trip.driverId = driverId;
    trip.status = "Dispatched";
    setVehicleStatus(vehicleId, "On Trip");
    setDriverStatus(driverId, "On Trip");
    return trip;
  }
  const { data } = await httpClient.patch(`/trips/${id}/dispatch`, { vehicleId, driverId });
  return data;
}

// Contract: PATCH /trips/:id/complete -> Trip
// Side effect: restores vehicle + driver to "Available"
export async function completeTrip(id) {
  if (USE_MOCK) {
    await mockDelay();
    const trip = trips.find((t) => t.id === id);
    if (!trip) throw new Error("Trip not found");
    trip.status = "Completed";
    setVehicleStatus(trip.vehicleId, "Available");
    setDriverStatus(trip.driverId, "Available");
    return trip;
  }
  const { data } = await httpClient.patch(`/trips/${id}/complete`);
  return data;
}

// Contract: PATCH /trips/:id/cancel -> Trip
// Side effect: restores vehicle + driver to "Available" only if they were already assigned
export async function cancelTrip(id) {
  if (USE_MOCK) {
    await mockDelay();
    const trip = trips.find((t) => t.id === id);
    if (!trip) throw new Error("Trip not found");
    if (trip.vehicleId) setVehicleStatus(trip.vehicleId, "Available");
    if (trip.driverId) setDriverStatus(trip.driverId, "Available");
    trip.status = "Cancelled";
    return trip;
  }
  const { data } = await httpClient.patch(`/trips/${id}/cancel`);
  return data;
}