import { useForm } from "react-hook-form";
import { isRegNumberUnique } from "../../utils/businessRules";

const VEHICLE_TYPES = ["Van", "Truck", "Mini Truck", "Trailer"];
const STATUSES = ["Available", "On Trip", "In Shop", "Retired"];
const REGIONS = ["North", "South", "East", "West"];

export default function VehicleForm({ vehicle, allVehicles, onSubmit, onCancel, isSubmitting }) {
  const isEdit = Boolean(vehicle);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: vehicle || { status: "Available" } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Registration Number</label>
        <input
          {...register("regNumber", {
            required: "Registration number is required",
            validate: (v) =>
              isRegNumberUnique(allVehicles, v, vehicle?.id) || "This registration number is already in use",
          })}
          disabled={isEdit}
          className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm disabled:bg-surface disabled:text-gray-400"
          placeholder="GJ01AB1234"
        />
        {errors.regNumber && <p className="text-xs text-red-600 mt-1">{errors.regNumber.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Vehicle Name / Model</label>
        <input
          {...register("name", { required: "Name is required" })}
          className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          placeholder="Van-06"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select {...register("type", { required: true })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white">
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Region</label>
          <select {...register("region", { required: true })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white">
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Max Load Capacity (kg)</label>
          <input
            type="number"
            {...register("maxLoadKg", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Must be positive" } })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.maxLoadKg && <p className="text-xs text-red-600 mt-1">{errors.maxLoadKg.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Odometer (km)</label>
          <input
            type="number"
            {...register("odometer", { required: "Required", valueAsNumber: true, min: 0 })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.odometer && <p className="text-xs text-red-600 mt-1">{errors.odometer.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Acquisition Cost</label>
          <input
            type="number"
            {...register("acquisitionCost", { required: "Required", valueAsNumber: true, min: 0 })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.acquisitionCost && <p className="text-xs text-red-600 mt-1">{errors.acquisitionCost.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select {...register("status", { required: true })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-surface-border hover:bg-surface">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add vehicle"}
        </button>
      </div>
    </form>
  );
}