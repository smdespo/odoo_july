export function isVehicleDispatchable(vehicle) {
  return vehicle.status === "Available";
}

export function isLicenseExpired(driver, today = new Date()) {
  return new Date(driver.licenseExpiry) < today;
}

export function isDriverDispatchable(driver) {
  return driver.status === "Available" && !isLicenseExpired(driver);
}

export function isRegNumberUnique(vehicles, regNumber, excludeId = null) {
  return !vehicles.some((v) => v.regNumber === regNumber && v.id !== excludeId);
}

export function validateDispatch({ vehicle, driver, cargoWeightKg }) {
  const errors = [];

  if (!vehicle) errors.push("Select a vehicle.");
  if (!driver) errors.push("Select a driver.");

  if (vehicle && !isVehicleDispatchable(vehicle)) {
    errors.push(`Vehicle ${vehicle.regNumber} is not available for dispatch.`);
  }
  if (driver && !isDriverDispatchable(driver)) {
    errors.push(
      isLicenseExpired(driver)
        ? `${driver.name}'s license has expired.`
        : `${driver.name} is not available (status: ${driver.status}).`
    );
  }
  if (vehicle && cargoWeightKg > vehicle.maxLoadKg) {
    errors.push(
      `Cargo weight ${cargoWeightKg}kg exceeds ${vehicle.regNumber}'s capacity of ${vehicle.maxLoadKg}kg.`
    );
  }

  return { valid: errors.length === 0, errors };
}

export function computeOperationalCost(vehicleId, fuelLogs, maintenanceLogs) {
  const fuelCost = fuelLogs.filter((f) => f.vehicleId === vehicleId).reduce((s, f) => s + f.cost, 0);
  const maintenanceCost = maintenanceLogs.filter((m) => m.vehicleId === vehicleId).reduce((s, m) => s + m.cost, 0);
  return { fuelCost, maintenanceCost, total: fuelCost + maintenanceCost };
}

export function computeROI(vehicle, revenue, fuelLogs, maintenanceLogs) {
  const { total } = computeOperationalCost(vehicle.id, fuelLogs, maintenanceLogs);
  return ((revenue - total) / vehicle.acquisitionCost) * 100;
}

export function computeFuelEfficiency(distanceKm, liters) {
  if (!liters) return 0;
  return distanceKm / liters;
}