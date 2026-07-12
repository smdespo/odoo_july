export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 text-sm">
      <span className="text-gray-500">Page {page} of {totalPages}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-surface-border disabled:opacity-40 hover:bg-surface"
        >
          Prev
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-surface-border disabled:opacity-40 hover:bg-surface"
        >
          Next
        </button>
      </div>
    </div>
  );
}