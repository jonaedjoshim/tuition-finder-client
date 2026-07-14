export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold font-sora rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-royal text-white shadow-md hover:bg-royal-dark hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-royal-light text-royal border border-blue-200 hover:bg-royal hover:text-white',
    outline: 'bg-transparent border border-gray-200 text-gray-700 hover:border-royal hover:text-royal hover:bg-royal-light',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white',
    ghost: 'bg-transparent text-gray-500 hover:text-royal',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
