export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold font-inter rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-brand text-surface hover:bg-brand-strong",
    secondary: "bg-brand-soft text-brand hover:bg-brand/10",
    outline:
      "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
    danger: "bg-danger/10 text-danger hover:bg-danger/20",
    ghost: "bg-transparent text-muted hover:text-brand",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-[13px]",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-[15px]",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
