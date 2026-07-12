import { useForm } from "react-hook-form";

const LICENSE_CATEGORIES = ["LMV", "HMV", "LMV+HMV"];
const STATUSES = ["Available", "On Trip", "Suspended"];

export default function DriverForm({ driver, onSubmit, onCancel, isSubmitting }) {
  const isEdit = Boolean(driver);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: driver || { status: "Available", safetyScore: 100 } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          {...register("name", { required: "Name is required" })}
          className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          placeholder="Alex Fernandes"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">License Number</label>
          <input
            {...register("licenseNumber", { required: "Required" })}
            disabled={isEdit}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm disabled:bg-surface disabled:text-gray-400"
            placeholder="DL-12345"
          />
          {errors.licenseNumber && <p className="text-xs text-red-600 mt-1">{errors.licenseNumber.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Category</label>
          <select {...register("licenseCategory", { required: true })} className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm bg-white">
            {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">License Expiry</label>
          <input
            type="date"
            {...register("licenseExpiry", { required: "Required" })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.licenseExpiry && <p className="text-xs text-red-600 mt-1">{errors.licenseExpiry.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Number</label>
          <input
            {...register("contact", { required: "Required" })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
            placeholder="98765xxxxx"
          />
          {errors.contact && <p className="text-xs text-red-600 mt-1">{errors.contact.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Safety Score (0–100)</label>
          <input
            type="number"
            {...register("safetyScore", { required: "Required", valueAsNumber: true, min: 0, max: 100 })}
            className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm"
          />
          {errors.safetyScore && <p className="text-xs text-red-600 mt-1">{errors.safetyScore.message}</p>}
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
          {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add driver"}
        </button>
      </div>
    </form>
  );
}