import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Truck } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { ROLES } from "../../constants/navigation";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuthStore();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    const ok = await signup(data);
    if (ok) {
      toast.success("Account created");
      navigate("/dashboard");
    } else {
      toast.error("Could not create account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-md bg-brand-accent flex items-center justify-center">
            <Truck size={20} className="text-brand-900" />
          </div>
          <span className="font-semibold text-lg tracking-tight">TransitOps</span>
        </div>

        <h2 className="text-xl font-semibold mb-1 text-center">Create your account</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Get set up with TransitOps</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-sm"
              placeholder="Jordan Patel"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-sm"
              placeholder="you@company.com"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              {...register("role", { required: "Role is required" })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-sm bg-white"
              defaultValue=""
            >
              <option value="" disabled>Select a role</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required", minLength: { value: 6, message: "At least 6 characters" } })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm password</label>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (v) => v === password || "Passwords do not match",
              })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-sm"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-brand-accent text-brand-900 font-medium text-sm hover:bg-brand-accent-hover transition-colors disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-accent-hover font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}