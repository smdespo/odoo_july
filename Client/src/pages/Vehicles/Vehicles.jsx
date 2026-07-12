import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Ban } from "lucide-react";
import { getVehicles, createVehicle, updateVehicle, retireVehicle } from "../../services/vehicleService";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/modal/Modal";
import ConfirmDialog from "../../components/modal/ConfirmDialog";
import VehicleForm from "../../components/forms/VehicleForm";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 5;

export default function Vehicles() {
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [retireTarget, setRetireTarget] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      toast.success("Vehicle added");
      invalidate();
      setFormOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => updateVehicle(id, changes),
    onSuccess: () => {
      toast.success("Vehicle updated");
      invalidate();
      setFormOpen(false);
      setEditingVehicle(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const retireMutation = useMutation({
    mutationFn: retireVehicle,
    onSuccess: () => {
      toast.success("Vehicle retired");
      invalidate();
      setRetireTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const vehicleTypes = useMemo(() => ["All", ...new Set(vehicles.map((v) => v.type))], [vehicles]);
  const vehicleStatuses = useMemo(() => ["All", ...new Set(vehicles.map((v) => v.status))], [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter(
      (v) =>
        (typeFilter === "All" || v.type === typeFilter) &&
        (statusFilter === "All" || v.status === statusFilter) &&
        (v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
          v.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [vehicles, typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };
  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleSubmit = (data) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, changes: data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72 max-w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reg number or name..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="text-sm border border-surface-border rounded-lg px-2.5 py-2 bg-white">
            {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-surface-border rounded-lg px-2.5 py-2 bg-white">
            {vehicleStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading vehicles...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-3 font-medium">Reg. Number</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Odometer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((v) => (
                <tr key={v.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-gray-800">{v.regNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.type}</td>
                  <td className="px-4 py-3 text-gray-600">{v.maxLoadKg} kg</td>
                  <td className="px-4 py-3 text-gray-600">{v.odometer.toLocaleString()} km</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-surface text-gray-500" title="Edit">
                        <Pencil size={15} />
                      </button>
                      {v.status !== "Retired" && (
                        <button onClick={() => setRetireTarget(v)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Retire">
                          <Ban size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No vehicles match your filters.</td></tr>
              )}
            </tbody>
          </table>
        )}
        <div className="px-4 pb-3">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}>
        <VehicleForm
          vehicle={editingVehicle}
          allVehicles={vehicles}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(retireTarget)}
        onClose={() => setRetireTarget(null)}
        onConfirm={() => retireMutation.mutate(retireTarget.id)}
        title="Retire vehicle"
        message={`Retire ${retireTarget?.regNumber}? It will be hidden from dispatch selection.`}
        confirmLabel="Retire"
        danger
      />
    </div>
  );
}