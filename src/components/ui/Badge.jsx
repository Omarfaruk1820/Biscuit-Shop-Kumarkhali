
import clsx from "clsx";

const Badge = ({
  children,
  variant = "default",
  size = "md",
  outline = false,
  className = "",
}) => {
  const base = "inline-flex items-center font-semibold rounded-full";

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const variants = {
    default: outline
      ? "border border-gray-300 text-gray-700"
      : "bg-gray-200 text-gray-800",

    success: outline
      ? "border border-green-500 text-green-600"
      : "bg-green-100 text-green-700",

    error: outline
      ? "border border-red-500 text-red-600"
      : "bg-red-100 text-red-700",

    warning: outline
      ? "border border-yellow-500 text-yellow-600"
      : "bg-yellow-100 text-yellow-700",

    info: outline
      ? "border border-blue-500 text-blue-600"
      : "bg-blue-100 text-blue-700",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;