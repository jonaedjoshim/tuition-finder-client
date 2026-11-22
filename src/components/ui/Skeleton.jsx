export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-lg bg-line/60 ${className}`}
    />
  );
}

export default Skeleton;
