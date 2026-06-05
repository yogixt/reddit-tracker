const COLORS = [
  "#ff4500",
  "#e8590c",
  "#f59f00",
  "#74b816",
  "#22b8cf",
  "#4c8bf5",
  "#9775fa",
  "#f06595",
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
      className="flex shrink-0 select-none items-center justify-center rounded-full border font-medium"
      style={{
        width: size,
        height: size,
        background: `${color}14`,
        borderColor: `${color}33`,
        color,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
