import { useForm } from "react-hook-form";

export default function TripForm({ onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <input
            {...register("source", { required: "Required" })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
            placeholder="Gandhinagar Depot"
          />
          {errors.source && <p className="text-xs text-red-600 mt-1">{errors.source.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input
            {...register("destination", { required: "Required" })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
            placeholder="Ahmedabad Hub"
          />
          {errors.destination && <p className="text-xs text-red-600 mt-1">{errors.destination.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Cargo Weight (kg)</label>
          <input
            type="number"
            {...register("cargoWeightKg", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Must be positive" } })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.cargoWeightKg && <p className="text-xs text-red-600 mt-1">{errors.cargoWeightKg.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Distance (km)</label>
          <input
            type="number"
            {...register("distanceKm", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Must be positive" } })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.distanceKm && <p className="text-xs text-red-600 mt-1">{errors.distanceKm.message}</p>}
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
          {isSubmitting ? "Saving..." : "Create trip (Draft)"}
        </button>
      </div>
    </form>
  );
}