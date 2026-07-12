import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Wrench, CheckCircle2 } from "lucide-react";
import { getMaintenanceLogs, openMaintenanceLog, closeMaintenanceLog } from "../../services/maintenanceService";
import { getVehicles } from "../../services/vehicleService";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/modal/Modal";
import ConfirmDialog from "../../components/modal/ConfirmDialog";
import MaintenanceForm from "../../components/forms/MaintenanceForm";

export default function Maintenance() {
  const queryClient = useQueryClient();
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["maintenance"], queryFn: getMaintenanceLogs });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });

  const [formOpen, setFormOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const openMutation = useMutation({
    mutationFn: openMaintenanceLog,
    onSuccess: () => { toast.success("Vehicle sent to maintenance"); invalidateAll(); setFormOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: closeMaintenanceLog,
    onSuccess: () => { toast.success("Maintenance closed — vehicle available again"); invalidateAll(); setCloseTarget(null); },
    onError: (e) => toast.error(e.message),
  });

  const vehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.regNumber} — ${v.name}` : id;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Maintenance Logs</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover"
        >
          <Plus size={16} /> Send to Maintenance
        </button>
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading maintenance logs...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-1.5">
                    <Wrench size={13} className="text-gray-400" /> {vehicleLabel(log.vehicleId)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.type}</td>
                  <td className="px-4 py-3 text-gray-600">{log.date}</td>
                  <td className="px-4 py-3 text-gray-600">₹{log.cost.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {log.status === "In Shop" && (
                      <button
                        onClick={() => setCloseTarget(log)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-status-available text-white font-medium hover:opacity-90"
                      >
                        <CheckCircle2 size={13} /> Close & Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No maintenance logs yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Send Vehicle to Maintenance">
        <MaintenanceForm
          vehicles={vehicles}
          onSubmit={(data) => openMutation.mutate(data)}
          onCancel={() => setFormOpen(false)}
          isSubmitting={openMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(closeTarget)}
        onClose={() => setCloseTarget(null)}
        onConfirm={() => closeMutation.mutate(closeTarget.id)}
        title="Close maintenance"
        message={`Mark this ${closeTarget?.type} job as done? The vehicle will become Available again.`}
        confirmLabel="Close & Release"
      />
    </div>
  );
}