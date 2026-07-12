import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, ShieldOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { getDrivers, createDriver, updateDriver, suspendDriver, reinstateDriver } from "../../services/driverService";
import { isLicenseExpired, isLicenseExpiringSoon } from "../../utils/businessRules";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/modal/Modal";
import ConfirmDialog from "../../components/modal/ConfirmDialog";
import DriverForm from "../../components/forms/DriverForm";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 5;

export default function Drivers() {
  const queryClient = useQueryClient();
  const { data: drivers = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["drivers"] });

  const createMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => { toast.success("Driver added"); invalidate(); setFormOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => updateDriver(id, changes),
    onSuccess: () => { toast.success("Driver updated"); invalidate(); setFormOpen(false); setEditingDriver(null); },
    onError: (e) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendDriver,
    onSuccess: () => { toast.success("Driver suspended"); invalidate(); setSuspendTarget(null); },
    onError: (e) => toast.error(e.message),
  });

  const reinstateMutation = useMutation({
    mutationFn: reinstateDriver,
    onSuccess: () => { toast.success("Driver reinstated"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const driverStatuses = useMemo(() => ["All", ...new Set(drivers.map((d) => d.status))], [drivers]);

  const filtered = useMemo(() => {
    return drivers.filter(
      (d) =>
        (statusFilter === "All" || d.status === statusFilter) &&
        (d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.licenseNumber.toLowerCase().includes(search.toLowerCase()))
    );
  }, [drivers, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => { setEditingDriver(null); setFormOpen(true); };
  const openEdit = (driver) => { setEditingDriver(driver); setFormOpen(true); };

  const handleSubmit = (data) => {
    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, changes: data });
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
            placeholder="Search name or license..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-surface-border rounded-lg px-2.5 py-2 bg-white">
            {driverStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-accent text-brand-900 font-medium hover:bg-brand-accent-hover"
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading drivers...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">License</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Safety Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => {
                const expired = isLicenseExpired(d);
                const expiringSoon = !expired && isLicenseExpiringSoon(d);
                return (
                  <tr key={d.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.licenseNumber} · {d.licenseCategory}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 ${expired ? "text-red-600 font-medium" : expiringSoon ? "text-amber-600 font-medium" : "text-gray-600"}`}>
                        {(expired || expiringSoon) && <AlertTriangle size={13} />}
                        {d.licenseExpiry}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.contact}</td>
                    <td className="px-4 py-3 text-gray-600">{d.safetyScore}</td>
                    <td className="px-4 py-3"><StatusBadge status={expired ? "Suspended" : d.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-surface text-gray-500" title="Edit">
                          <Pencil size={15} />
                        </button>
                        {d.status === "Suspended" ? (
                          <button onClick={() => reinstateMutation.mutate(d.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Reinstate">
                            <ShieldCheck size={15} />
                          </button>
                        ) : (
                          <button onClick={() => setSuspendTarget(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Suspend">
                            <ShieldOff size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No drivers match your filters.</td></tr>
              )}
            </tbody>
          </table>
        )}
        <div className="px-4 pb-3">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingDriver ? "Edit Driver" : "Add Driver"}>
        <DriverForm
          driver={editingDriver}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onConfirm={() => suspendMutation.mutate(suspendTarget.id)}
        title="Suspend driver"
        message={`Suspend ${suspendTarget?.name}? They'll be excluded from trip dispatch until reinstated.`}
        confirmLabel="Suspend"
        danger
      />
    </div>
  );
}