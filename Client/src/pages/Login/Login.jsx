import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Truck } from "lucide-react";
import useAuthStore from "../../store/authStore";

const DEMO_ACCOUNTS = [
  { role: "Fleet Manager", email: "manager@transitops.com" },
  { role: "Dispatcher", email: "dispatcher@transitops.com" },
  { role: "Safety Officer", email: "safety@transitops.com" },
  { role: "Financial Analyst", email: "finance@transitops.com" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const ok = await login(data.email, data.password);
    if (ok) {
      toast.success("Welcome back");
      navigate("/dashboard");
    } else {
      toast.error("Invalid email or password");
    }
  };

  const fillDemo = (email) => {
    setValue("email", email);
    setValue("password", "password123");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-brand-900 text-white p-10">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-9 h-9 rounded-md bg-brand-accent flex items-center justify-center">
              <Truck size={20} className="text-brand-900" />
            </div>
            <span className="font-semibold text-lg tracking-tight">TransitOps</span>
          </div>
          <h1 className="text-2xl font-semibold leading-snug mb-3">
            Smart Transport
            <br /> Operations Platform
          </h1>
          <p className="text-gray-400 text-sm mb-8">One login, four roles:</p>
          <ul className="space-y-3 text-sm text-gray-300">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.role} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                {a.role}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-gray-500">TransitOps · Fleet Command</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-sm"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="rounded border-surface-border" />
                Remember me
              </label>
              <a href="#" className="text-brand-accent-hover hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-brand-accent text-brand-900 font-medium text-sm hover:bg-brand-accent-hover transition-colors disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand-accent-hover font-medium hover:underline">
              Sign up
            </Link>
          </p>

          <div className="mt-8 pt-5 border-t border-surface-border">
            <p className="text-xs text-gray-400 mb-2">Quick demo login (password: password123)</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a.email)}
                  className="text-xs px-2.5 py-1 rounded-full border border-surface-border hover:bg-surface text-gray-600"
                >
                  {a.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}