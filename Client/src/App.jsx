import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import ProtectedLayout from "./components/layout/ProtectedLayout";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
// import Dashboard from "./pages/Dashboard/Dashboard";
import Vehicles from "./pages/Vehicles/Vehicles";
// import Drivers from "./pages/Drivers/Drivers";
// import Trips from "./pages/Trips/Trips";
// import Maintenance from "./pages/Maintenance/Maintenance";
// import FuelExpenses from "./pages/FuelExpenses/FuelExpenses";
// import Analytics from "./pages/Analytics/Analytics";
// import Settings from "./pages/Settings/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/fuel-expenses" element={<FuelExpenses />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}