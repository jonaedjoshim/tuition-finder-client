export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div
      className={`surface-card ${hover ? "transition-shadow duration-200 hover:shadow-md" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
