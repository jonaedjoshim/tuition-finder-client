export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${
        hover ? 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
