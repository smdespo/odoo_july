import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getVehicles } from "../../services/vehicleService";
import { getFuelLogs, getExpenses } from "../../services/fuelExpenseService";
import { getMaintenanceLogs } from "../../services/maintenanceService";
import { computeOperationalCost, computeFuelEfficiency, computeROI } from "../../utils/businessRules";

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="h-64">{children}</div>
    </div>
  );
}

export default function Analytics() {
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: fuelLogs = [] } = useQuery({ queryKey: ["fuelLogs"], queryFn: getFuelLogs });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: getExpenses });
  const { data: maintenanceLogs = [] } = useQuery({ queryKey: ["maintenance"], queryFn: getMaintenanceLogs });

  const efficiencyData = useMemo(() => {
    return vehicles.map((v) => {
      const liters = fuelLogs.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.liters, 0);
      return { name: v.regNumber, efficiency: Number(computeFuelEfficiency(v.odometer, liters).toFixed(1)) };
    });
  }, [vehicles, fuelLogs]);

  const costData = useMemo(() => {
    return vehicles.map((v) => {
      const { fuelCost, maintenanceCost } = computeOperationalCost(v.id, fuelLogs, maintenanceLogs);
      return { name: v.regNumber, fuel: fuelCost, maintenance: maintenanceCost };
    });
  }, [vehicles, fuelLogs, maintenanceLogs]);

  const roiData = useMemo(() => {
    // No real revenue tracking yet — using a simple placeholder assumption
    // (₹5/km * odometer) purely to demo the ROI formula on the chart.
    return vehicles.map((v) => {
      const assumedRevenue = v.odometer * 5;
      return { name: v.regNumber, roi: Number(computeROI(v, assumedRevenue, fuelLogs, maintenanceLogs).toFixed(1)) };
    });
  }, [vehicles, fuelLogs, maintenanceLogs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Fuel Efficiency (km per liter)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#F0A93B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Operational Cost per Vehicle">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="fuel" stackId="cost" fill="#2563EB" name="Fuel" />
              <Bar dataKey="maintenance" stackId="cost" fill="#EA8C1F" name="Maintenance" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Estimated ROI (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="roi" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <p className="text-xs text-gray-400">
        ROI uses an assumed revenue rate (₹5/km) as a placeholder until real trip revenue data is available from the backend.
      </p>
    </div>
  );
}