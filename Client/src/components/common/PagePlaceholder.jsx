export default function PagePlaceholder({ title, phase }) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-10 text-center">
      <h1 className="text-lg font-semibold mb-1">{title}</h1>
      <p className="text-sm text-gray-500">Coming up in {phase}.</p>
    </div>
  );
}