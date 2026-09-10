import clsx from "clsx";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "gold";
}) {
  const tones: Record<string, string> = {
    default: "bg-black/5 text-ink/70",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    gold: "bg-gold-400/15 text-gold-500",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Avatar({ src, alt, size = 40 }: { src?: string | null; alt: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-rose-100 overflow-hidden flex items-center justify-center text-rose-500 font-semibold shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{alt.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-rose-50 mb-4" />
      <p className="font-medium text-ink">{title}</p>
      <p className="text-sm text-ink/50 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse bg-black/5 rounded-xl", className)} />;
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0" />
      <div className="relative surface-card w-full max-w-md p-6 z-10">{children}</div>
    </div>
  );
}
