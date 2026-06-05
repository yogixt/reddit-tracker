const COLORS = [
  "#8B5CF6",
  "#06B6D4",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#3B82F6",
  "#EF4444",
  "#A78BFA",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const color = COLORS[hashName(name) % COLORS.length];
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        background: `${color}26`,
        color,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
