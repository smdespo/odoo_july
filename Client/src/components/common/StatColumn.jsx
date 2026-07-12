export default function StatColumn({ label, count, colorClass }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}