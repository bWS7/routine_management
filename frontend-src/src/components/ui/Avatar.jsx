export default function Avatar({ src, name, size = 'md', className = '' }) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl',
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <div className={`shrink-0 rounded-xl overflow-hidden bg-primary-600/10 flex items-center justify-center text-primary-400 font-bold border border-primary-600/20 ${selectedSize} ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
