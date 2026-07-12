import httpClient from "./httpClient";
import { USE_MOCK, mockDelay } from "./config";
import { maintenanceLogs, vehicles } from "../data/mockData";

function setVehicleStatus(vehicleId, status) {
  const v = vehicles.find((v) => v.id === vehicleId);
  if (v) v.status = status;
}

// Contract: GET /maintenance -> MaintenanceLog[]
export async function getMaintenanceLogs() {
  if (USE_MOCK) {
    await mockDelay();
    return [...maintenanceLogs];
  }
  const { data } = await httpClient.get("/maintenance");
  return data;
}

// Contract: POST /maintenance -> MaintenanceLog (status: In Shop)
// Side effect: pulls the vehicle out of the dispatch pool
export async function openMaintenanceLog(payload) {
  if (USE_MOCK) {
    await mockDelay();
    const newLog = {
      id: `M-${Date.now()}`,
      status: "In Shop",
      ...payload,
    };
    maintenanceLogs.push(newLog);
    setVehicleStatus(payload.vehicleId, "In Shop");
    return newLog;
  }
  const { data } = await httpClient.post("/maintenance", payload);
  return data;
}

// Contract: PATCH /maintenance/:id/close -> MaintenanceLog
// Side effect: restores vehicle to Available
export async function closeMaintenanceLog(id) {
  if (USE_MOCK) {
    await mockDelay();
    const log = maintenanceLogs.find((m) => m.id === id);
    if (!log) throw new Error("Maintenance log not found");
    log.status = "Completed";
    setVehicleStatus(log.vehicleId, "Available");
    return log;
  }
  const { data } = await httpClient.patch(`/maintenance/${id}/close`);
  return data;
}