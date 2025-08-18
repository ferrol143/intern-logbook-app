import React, { ReactNode, forwardRef } from "react"

interface DropdownMenuProps {
  children: ReactNode
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>
}

interface DropdownMenuTriggerProps {
  children: React.ReactElement
  asChild?: boolean
}

// Fixed forwardRef implementation
export const DropdownMenuTrigger = forwardRef<
  HTMLElement,
  DropdownMenuTriggerProps & React.HTMLAttributes<HTMLElement>
>(({ children, asChild = false, ...props }, ref) => {
  if (!React.isValidElement(children)) return null

  if (asChild) {
    // Clone element with merged props and ref
    const mergedProps = {
      ...props,
      ref: ref
    }
    return React.cloneElement(children, mergedProps)
  }

  // If asChild false, wrap children with button
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} {...props}>
      {children}
    </button>
  )
})

DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps {
  children: ReactNode
  className?: string
  align?: "start" | "end"
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  className = "",
  align = "start",
}) => {
  const alignmentClass = align === "end" ? "right-0" : "left-0"

  return (
    <div
      className={`absolute mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${alignmentClass} ${className}`}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface DropdownMenuLabelProps {
  children: ReactNode
  className?: string
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none ${className}`}
    >
      {children}
    </div>
  )
}

interface DropdownMenuSeparatorProps {
  className?: string
}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
  className = "",
}) => {
  return <div className={`border-t border-gray-200 my-1 ${className}`} />
}