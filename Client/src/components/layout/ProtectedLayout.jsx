import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}