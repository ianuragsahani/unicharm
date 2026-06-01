import { cn, initials } from "@/lib/utils";

export const Avatar = ({ name, size = 36, className }: { name: string; size?: number; className?: string }) => {
  const i = initials(name) || "?";
  const hue = (i.charCodeAt(0) * 37) % 360;
  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-full font-medium text-white shrink-0", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}
    >
      {i}
    </div>
  );
};
