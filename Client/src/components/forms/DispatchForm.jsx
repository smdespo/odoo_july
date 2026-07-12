import { useMemo, useState } from "react";
import { validateDispatch, isVehicleDispatchable, isDriverDispatchable } from "../../utils/businessRules";

export default function DispatchForm({ trip, vehicles, drivers, onSubmit, onCancel, isSubmitting }) {
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const availableVehicles = useMemo(() => vehicles.filter(isVehicleDispatchable), [vehicles]);
  const availableDrivers = useMemo(() => drivers.filter(isDriverDispatchable), [drivers]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedDriver = drivers.find((d) => d.id === driverId);

  const { valid, errors } = validateDispatch({
    vehicle: selectedVehicle,
    driver: selectedDriver,
    cargoWeightKg: trip.cargoWeightKg,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valid) onSubmit({ vehicleId, driverId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface rounded-lg p-3 text-sm text-gray-600">
        <div className="flex justify-between"><span>Route</span><span className="font-medium text-gray-800">{trip.source} → {trip.destination}</span></div>
        <div className="flex justify-between mt-1"><span>Cargo</span><span className="font-medium text-gray-800">{trip.cargoWeightKg} kg</span></div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Vehicle</label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white"
        >
          <option value="">Select an available vehicle</option>
          {availableVehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.regNumber} — {v.name} (max {v.maxLoadKg}kg)</option>
          ))}
        </select>
        {availableVehicles.length === 0 && <p className="text-xs text-amber-600 mt-1">No vehicles currently available.</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Driver</label>
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white"
        >
          <option value="">Select an available driver</option>
          {availableDrivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.licenseCategory}</option>
          ))}
        </select>
        {availableDrivers.length === 0 && <p className="text-xs text-amber-600 mt-1">No drivers currently available.</p>}
      </div>

      {(vehicleId || driverId) && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">{err}</p>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-surface-border hover:bg-surface">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || isSubmitting}
          className="px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? "Dispatching..." : "Dispatch trip"}
        </button>
      </div>
    </form>
  );
}