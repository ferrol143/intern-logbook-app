import React, { useId } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
  id?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  className = "",
  id,
  ...props
}) => {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-transparent transition duration-300 ${className}`}
        {...props}
      />
    </div>
  )
}
