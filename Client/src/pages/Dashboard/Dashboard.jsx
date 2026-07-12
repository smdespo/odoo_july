import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, CheckCircle2, Wrench, Route, Users, Gauge } from "lucide-react";
import { getVehicles } from "../../services/vehicleService";
import { getDrivers } from "../../services/driverService";
import { getTrips } from "../../services/tripService";
import StatusBadge from "../../components/common/StatusBadge";

function KpiCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xl font-semibold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });
  const { data: trips = [] } = useQuery({ queryKey: ["trips"], queryFn: getTrips });

  const kpis = useMemo(() => {
    const activeVehicles = vehicles.filter((v) => v.status !== "Retired").length;
    const availableVehicles = vehicles.filter((v) => v.status === "Available").length;
    const inMaintenance = vehicles.filter((v) => v.status === "In Shop").length;
    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const driversOnDuty = drivers.filter((d) => d.status === "On Trip").length;
    const utilization = activeVehicles > 0 ? Math.round(((activeVehicles - availableVehicles) / activeVehicles) * 100) : 0;

    return { activeVehicles, availableVehicles, inMaintenance, activeTrips, driversOnDuty, utilization };
  }, [vehicles, drivers, trips]);

  const recentTrips = useMemo(() => [...trips].slice(-5).reverse(), [trips]);

  const vehicleLabel = (id) => vehicles.find((v) => v.id === id)?.regNumber ?? "—";
  const driverLabel = (id) => drivers.find((d) => d.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Truck} label="Active Vehicles" value={kpis.activeVehicles} tint="bg-blue-50 text-blue-600" />
        <KpiCard icon={CheckCircle2} label="Available" value={kpis.availableVehicles} tint="bg-green-50 text-green-600" />
        <KpiCard icon={Wrench} label="In Maintenance" value={kpis.inMaintenance} tint="bg-amber-50 text-amber-600" />
        <KpiCard icon={Route} label="Active Trips" value={kpis.activeTrips} tint="bg-indigo-50 text-indigo-600" />
        <KpiCard icon={Users} label="Drivers On Duty" value={kpis.driversOnDuty} tint="bg-purple-50 text-purple-600" />
        <KpiCard icon={Gauge} label="Fleet Utilization" value={`${kpis.utilization}%`} tint="bg-rose-50 text-rose-600" />
      </div>

      <div className="bg-white rounded-xl border border-surface-border">
        <div className="px-4 py-3 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-gray-800">Recent Trips</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-surface-border">
              <th className="px-4 py-3 font-medium">Trip ID</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Driver</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTrips.map((t) => (
              <tr key={t.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                <td className="px-4 py-3 font-medium text-gray-800">{t.id}</td>
                <td className="px-4 py-3 text-gray-600">{t.source} → {t.destination}</td>
                <td className="px-4 py-3 text-gray-600">{vehicleLabel(t.vehicleId)}</td>
                <td className="px-4 py-3 text-gray-600">{driverLabel(t.driverId)}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
            {recentTrips.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No trips yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}