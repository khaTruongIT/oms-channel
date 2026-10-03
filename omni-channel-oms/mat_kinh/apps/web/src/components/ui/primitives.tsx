import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@optiqis/ui";

type Tone = "primary" | "secondary" | "ghost" | "danger";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneStyles: Record<Tone, string> = {
  primary:
    "bg-[color:var(--primary)] text-white shadow-[0_8px_24px_rgba(8,74,120,0.22)] hover:bg-[color:var(--primary-container)]",
  secondary:
    "border border-[rgba(29,143,209,0.24)] bg-[color:var(--ice)] text-[color:var(--primary)] hover:bg-white",
  ghost: "text-[color:var(--primary)] hover:bg-[color:var(--surface-soft)]",
  danger: "bg-[color:var(--danger)] text-white hover:opacity-90",
};

export function ButtonLink({
  href,
  children,
  tone = "primary",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition active:scale-[0.98]",
        toneStyles[tone],
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  tone?: Tone;
};

export function Button({
  className,
  tone = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        toneStyles[tone],
        className,
      )}
      type={type}
      {...props}
    />
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "mx-auto max-w-3xl text-center md:block",
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        <div className="metric-label text-[color:var(--secondary)]">
          {eyebrow}
        </div>
        <h2 className="headline-title mt-3 text-[color:var(--primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] md:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "cyan" | "navy" | "muted" | "amber";
}

const metricTone: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  cyan: "bg-[color:var(--ice)] text-[color:var(--secondary)]",
  navy: "bg-[color:var(--primary)] text-white",
  muted: "bg-[color:var(--surface-soft)] text-[color:var(--muted)]",
  amber: "bg-amber-50 text-amber-700",
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "cyan",
}: MetricCardProps) {
  return (
    <div className="optical-surface rounded-xl p-5">
      <div
        className={cn(
          "mb-4 inline-flex rounded-lg px-2.5 py-1 metric-label",
          metricTone[tone],
        )}
      >
        {label}
      </div>
      <div className="metric-value text-[color:var(--primary)]">{value}</div>
      {detail ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

interface BreadcrumbItem {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="content-shell flex items-center gap-2 overflow-x-auto py-3 text-sm text-[color:var(--muted)] scrollbar-none"
    >
      {items.map((item, index) => (
        <span
          className="flex shrink-0 items-center gap-2"
          key={`${item.label}-${index}`}
        >
          {index > 0 ? (
            <span className="text-[color:var(--border)]">/</span>
          ) : null}
          {item.href ? (
            <Link
              className="font-semibold hover:text-[color:var(--primary)]"
              href={item.href}
            >
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[320px] truncate font-bold text-[color:var(--primary)]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function FieldShell({
  label,
  children,
  hint,
  icon,
  className,
}: Readonly<{
  label: string;
  children: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 flex items-center justify-between gap-3">
        <span className="metric-label inline-flex items-center gap-2 text-[color:var(--secondary)]">
          {icon ? (
            <span className="text-[color:var(--primary)]">{icon}</span>
          ) : null}
          {label}
        </span>
        {hint ? (
          <span className="text-xs font-semibold text-[color:var(--outline)]">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
