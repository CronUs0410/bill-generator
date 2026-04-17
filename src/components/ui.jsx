"use client";

export function Card({ className = "", children }) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
    >
      {children}
    </section>
  );
}

export function Field({ label, children, hint, labelClassName }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-semibold ${labelClassName || "text-slate-700"}`}>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 ${
        props.className || ""
      }`}
    />
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const styles =
    variant === "secondary"
      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
      : variant === "ghost"
        ? "bg-transparent text-brand hover:bg-brand/5"
        : "bg-accent text-white hover:bg-orange-600";

  return (
    <button
      {...props}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

export function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h2 className="text-xl font-bold text-brand">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

