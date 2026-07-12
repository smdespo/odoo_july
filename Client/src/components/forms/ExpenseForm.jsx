import { useForm } from "react-hook-form";

const EXPENSE_TYPES = ["Toll", "Parking", "Fine", "Permit", "Other"];

export default function ExpenseForm({ vehicles, onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { date: new Date().toISOString().slice(0, 10) } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Vehicle</label>
        <select {...register("vehicleId", { required: "Select a vehicle" })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white">
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>
          ))}
        </select>
        {errors.vehicleId && <p className="text-xs text-red-600 mt-1">{errors.vehicleId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select {...register("type", { required: true })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white">
            {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" {...register("date", { required: "Required" })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="number"
          {...register("amount", { required: "Required", valueAsNumber: true, min: { value: 0, message: "Must be 0 or more" } })}
          className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
        />
        {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
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
          {isSubmitting ? "Saving..." : "Log expense"}
        </button>
      </div>
    </form>
  );
}