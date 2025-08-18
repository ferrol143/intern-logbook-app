// Button Component
type ButtonVariant = "primary" | "outline" | "danger"

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  className?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  disabled = false, 
  type = "button" 
}) => {
  const baseClasses = `
    px-5 py-2.5 rounded-lg font-semibold
    transition-all duration-300 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-4 focus:ring-offset-2
    shadow-sm
  `

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400 text-white shadow-md",
    outline: "border border-gray-300 hover:bg-gray-100 text-gray-800 focus:ring-blue-400",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-400 text-white shadow-md",
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}