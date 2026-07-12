import { NavLink } from "react-router-dom";
import { navItemsForRole } from "../../constants/navigation";
import useAuthStore from "../../store/authStore";
import { Truck } from "lucide-react";

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const items = navItemsForRole(user?.role);

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-brand-900 text-white flex flex-col">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-md bg-brand-accent flex items-center justify-center">
          <Truck size={18} className="text-brand-900" />
        </div>
        <span className="font-semibold tracking-tight">TransitOps</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-brand-accent text-brand-900 font-medium"
                  : "text-gray-300 hover:bg-brand-800 hover:text-white"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-xs text-gray-400">
        TransitOps · Fleet Command
      </div>
    </aside>
  );
}