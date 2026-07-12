import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-surface-border hover:bg-surface"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm rounded-lg font-medium ${
            danger
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-brand-accent text-brand-900 hover:bg-brand-accent-hover"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}