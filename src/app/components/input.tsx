import React, { useId } from "react"

// Input Component
interface InputProps {
  label?: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  className?: string
  id?: string
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  required = false, 
  className = "",
  id 
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500" aria-label="required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={label ? `Masukkan ${label.toLowerCase()}` : undefined}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg
          placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-300
          focus:border-transparent transition duration-300
          ${className}`}
      />
    </div>
  )
}