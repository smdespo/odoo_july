import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, MapPin, Package, Truck as TruckIcon, User, CheckCircle2, XCircle } from "lucide-react";
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from "../../services/tripService";
import { getVehicles } from "../../services/vehicleService";
import { getDrivers } from "../../services/driverService";
import StatusBadge from "../../components/common/StatusBadge";
import StatColumn from "../../components/common/StatColumn";
import Modal from "../../components/modal/Modal";
import ConfirmDialog from "../../components/modal/ConfirmDialog";
import TripForm from "../../components/forms/TripForm";
import DispatchForm from "../../components/forms/DispatchForm";

const STAGES = [
  { key: "Draft", label: "Draft", color: "bg-gray-400" },
  { key: "Dispatched", label: "Dispatched", color: "bg-status-ontrip" },
  { key: "Completed", label: "Completed", color: "bg-status-available" },
  { key: "Cancelled", label: "Cancelled", color: "bg-status-retired" },
];

export default function Trips() {
  const queryClient = useQueryClient();
  const { data: trips = [] } = useQuery({ queryKey: ["trips"], queryFn: getTrips });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });

  const [createOpen, setCreateOpen] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Cross-screen sync: any trip mutation invalidates vehicles + drivers too,
  // since dispatch/complete/cancel flip their status as a side effect.
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
  };

  const createMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: () => { toast.success("Trip created as Draft"); invalidateAll(); setCreateOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ id, vehicleId, driverId }) => dispatchTrip(id, { vehicleId, driverId }),
    onSuccess: () => { toast.success("Trip dispatched"); invalidateAll(); setDispatchTarget(null); },
    onError: (e) => toast.error(e.message),
  });

  const completeMutation = useMutation({
    mutationFn: completeTrip,
    onSuccess: () => { toast.success("Trip completed"); invalidateAll(); setCompleteTarget(null); },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelTrip,
    onSuccess: () => { toast.success("Trip cancelled"); invalidateAll(); setCancelTarget(null); },
    onError: (e) => toast.error(e.message),
  });

  const byVehicle = (id) => vehicles.find((v) => v.id === id);
  const byDriver = (id) => drivers.find((d) => d.id === id);

  const grouped = useMemo(() => {
    const map = { Draft: [], Dispatched: [], Completed: [], Cancelled: [] };
    trips.forEach((t) => map[t.status]?.push(t));
    return map;
  }, [trips]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-5">
          {STAGES.map((s) => (
            <StatColumn key={s.key} label={s.label} count={grouped[s.key].length} colorClass={s.color} />
          ))}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover"
        >
          <Plus size={16} /> New Trip
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage.key} className="bg-white rounded-xl border border-surface-border flex flex-col">
            <div className="px-4 py-3 border-b border-surface-border flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-sm font-medium">{stage.label}</span>
            </div>
            <div className="p-3 space-y-3 flex-1 min-h-24">
              {grouped[stage.key].length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No trips</p>
              )}
              {grouped[stage.key].map((t) => {
                const vehicle = byVehicle(t.vehicleId);
                const driver = byDriver(t.driverId);
                return (
                  <div key={t.id} className="border border-surface-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">{t.id}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-xs text-gray-600 flex items-start gap-1.5">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span>{t.source} → {t.destination}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Package size={13} /> {t.cargoWeightKg} kg · {t.distanceKm} km
                    </div>
                    {vehicle && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <TruckIcon size={13} /> {vehicle.regNumber}
                      </div>
                    )}
                    {driver && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <User size={13} /> {driver.name}
                      </div>
                    )}

                    {stage.key === "Draft" && (
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => setDispatchTarget(t)}
                          className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover"
                        >
                          Dispatch
                        </button>
                        <button
                          onClick={() => setCancelTarget(t)}
                          className="px-2 py-1.5 rounded-lg border border-surface-border text-gray-500 hover:bg-surface"
                          title="Cancel"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                    {stage.key === "Dispatched" && (
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => setCompleteTarget(t)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-status-available text-white font-medium hover:opacity-90"
                        >
                          <CheckCircle2 size={13} /> Complete
                        </button>
                        <button
                          onClick={() => setCancelTarget(t)}
                          className="px-2 py-1.5 rounded-lg border border-surface-border text-gray-500 hover:bg-surface"
                          title="Cancel"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Trip">
        <TripForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setCreateOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      <Modal open={Boolean(dispatchTarget)} onClose={() => setDispatchTarget(null)} title={`Dispatch ${dispatchTarget?.id ?? ""}`}>
        {dispatchTarget && (
          <DispatchForm
            trip={dispatchTarget}
            vehicles={vehicles}
            drivers={drivers}
            onSubmit={({ vehicleId, driverId }) => dispatchMutation.mutate({ id: dispatchTarget.id, vehicleId, driverId })}
            onCancel={() => setDispatchTarget(null)}
            isSubmitting={dispatchMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        onConfirm={() => completeMutation.mutate(completeTarget.id)}
        title="Complete trip"
        message={`Mark ${completeTarget?.id} as completed? The vehicle and driver will be freed up as Available.`}
        confirmLabel="Complete"
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
        title="Cancel trip"
        message={`Cancel ${cancelTarget?.id}? This can't be undone.`}
        confirmLabel="Cancel trip"
        danger
      />
    </div>
  );
}