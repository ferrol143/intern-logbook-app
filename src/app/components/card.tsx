interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
    {children}
  </div>
)

export const CardHeader: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-6 py-5 border-b border-gray-300 bg-gray-50 rounded-t-xl ${className}`}>
    {children}
  </div>
)

export const CardTitle: React.FC<CardProps> = ({ children, className = "" }) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
)

export const CardContent: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)