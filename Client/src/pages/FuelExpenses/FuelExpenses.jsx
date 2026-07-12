import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Fuel, Receipt } from "lucide-react";
import { getFuelLogs, createFuelLog, getExpenses, createExpense } from "../../services/fuelExpenseService";
import { getVehicles } from "../../services/vehicleService";
import { getMaintenanceLogs } from "../../services/maintenanceService";
import { computeOperationalCost, computeFuelEfficiency } from "../../utils/businessRules";
import Modal from "../../components/modal/Modal";
import FuelLogForm from "../../components/forms/FuelLogForm";
import ExpenseForm from "../../components/forms/ExpenseForm";

const TABS = [
  { key: "fuel", label: "Fuel Logs", icon: Fuel },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "rollup", label: "Cost per Vehicle", icon: Receipt },
];

export default function FuelExpenses() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("fuel");
  const [fuelFormOpen, setFuelFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);

  const { data: fuelLogs = [] } = useQuery({ queryKey: ["fuelLogs"], queryFn: getFuelLogs });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: getExpenses });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: maintenanceLogs = [] } = useQuery({ queryKey: ["maintenance"], queryFn: getMaintenanceLogs });

  const fuelMutation = useMutation({
    mutationFn: createFuelLog,
    onSuccess: () => { toast.success("Fuel entry logged"); queryClient.invalidateQueries({ queryKey: ["fuelLogs"] }); setFuelFormOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const expenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => { toast.success("Expense logged"); queryClient.invalidateQueries({ queryKey: ["expenses"] }); setExpenseFormOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const vehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.regNumber} — ${v.name}` : id;
  };

  const rollup = useMemo(() => {
    return vehicles.map((v) => {
      const { fuelCost, maintenanceCost, total } = computeOperationalCost(v.id, fuelLogs, expenses.concat ? fuelLogs : [], maintenanceLogs);
      const vehicleFuelLogs = fuelLogs.filter((f) => f.vehicleId === v.id);
      const totalLiters = vehicleFuelLogs.reduce((s, f) => s + f.liters, 0);
      const totalDistance = v.odometer; // proxy metric for demo purposes
      const efficiency = computeFuelEfficiency(totalDistance, totalLiters);
      return { vehicle: v, fuelCost, maintenanceCost, total, efficiency };
    });
  }, [vehicles, fuelLogs, maintenanceLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white border border-surface-border rounded-lg p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${
                tab === key ? "bg-brand-accent text-brand-900 font-medium" : "text-gray-500 hover:bg-surface"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        {tab === "fuel" && (
          <button onClick={() => setFuelFormOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover">
            <Plus size={16} /> Log Fuel
          </button>
        )}
        {tab === "expenses" && (
          <button onClick={() => setExpenseFormOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover">
            <Plus size={16} /> Log Expense
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-x-auto">
        {tab === "fuel" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Liters</th>
                <th className="px-4 py-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((f) => (
                <tr key={f.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-gray-800">{vehicleLabel(f.vehicleId)}</td>
                  <td className="px-4 py-3 text-gray-600">{f.date}</td>
                  <td className="px-4 py-3 text-gray-600">{f.liters} L</td>
                  <td className="px-4 py-3 text-gray-600">₹{f.cost.toLocaleString()}</td>
                </tr>
              ))}
              {fuelLogs.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No fuel logs yet.</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "expenses" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-gray-800">{vehicleLabel(e.vehicleId)}</td>
                  <td className="px-4 py-3 text-gray-600">{e.type}</td>
                  <td className="px-4 py-3 text-gray-600">{e.date}</td>
                  <td className="px-4 py-3 text-gray-600">₹{e.amount.toLocaleString()}</td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No expenses logged yet.</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "rollup" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Fuel Cost</th>
                <th className="px-4 py-3 font-medium">Maintenance Cost</th>
                <th className="px-4 py-3 font-medium">Total Cost</th>
                <th className="px-4 py-3 font-medium">Efficiency (km/L)</th>
              </tr>
            </thead>
            <tbody>
              {rollup.map(({ vehicle, fuelCost, maintenanceCost, total, efficiency }) => (
                <tr key={vehicle.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-gray-800">{vehicle.regNumber} — {vehicle.name}</td>
                  <td className="px-4 py-3 text-gray-600">₹{fuelCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">₹{maintenanceCost.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">₹{total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{efficiency ? efficiency.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={fuelFormOpen} onClose={() => setFuelFormOpen(false)} title="Log Fuel Entry">
        <FuelLogForm vehicles={vehicles} onSubmit={(data) => fuelMutation.mutate(data)} onCancel={() => setFuelFormOpen(false)} isSubmitting={fuelMutation.isPending} />
      </Modal>

      <Modal open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} title="Log Expense">
        <ExpenseForm vehicles={vehicles} onSubmit={(data) => expenseMutation.mutate(data)} onCancel={() => setExpenseFormOpen(false)} isSubmitting={expenseMutation.isPending} />
      </Modal>
    </div>
  );
}