import httpClient from "./httpClient";
import { USE_MOCK, mockDelay } from "./config";
import { drivers } from "../data/mockData";

// Contract: GET /drivers -> Driver[]
export async function getDrivers() {
  if (USE_MOCK) {
    await mockDelay();
    return [...drivers];
  }
  const { data } = await httpClient.get("/drivers");
  return data;
}

// Contract: POST /drivers -> Driver
export async function createDriver(payload) {
  if (USE_MOCK) {
    await mockDelay();
    const newDriver = { id: `D-${Date.now()}`, status: "Available", safetyScore: 100, ...payload };
    drivers.push(newDriver);
    return newDriver;
  }
  const { data } = await httpClient.post("/drivers", payload);
  return data;
}

// Contract: PATCH /drivers/:id -> Driver
export async function updateDriver(id, changes) {
  if (USE_MOCK) {
    await mockDelay();
    const idx = drivers.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Driver not found");
    drivers[idx] = { ...drivers[idx], ...changes };
    return drivers[idx];
  }
  const { data } = await httpClient.patch(`/drivers/${id}`, changes);
  return data;
}

// Contract: PATCH /drivers/:id/suspend -> Driver
// Soft-action rather than delete, since drivers are referenced by trip history.
export async function suspendDriver(id) {
  if (USE_MOCK) {
    await mockDelay();
    const idx = drivers.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Driver not found");
    drivers[idx].status = "Suspended";
    return drivers[idx];
  }
  const { data } = await httpClient.patch(`/drivers/${id}/suspend`);
  return data;
}

export async function reinstateDriver(id) {
  if (USE_MOCK) {
    await mockDelay();
    const idx = drivers.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Driver not found");
    drivers[idx].status = "Available";
    return drivers[idx];
  }
  const { data } = await httpClient.patch(`/drivers/${id}/reinstate`);
  return data;
}