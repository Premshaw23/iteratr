import React from 'react'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType
  children: React.ReactNode
}

export default function Alert({
  type = 'info',
  className = '',
  children,
  ...props
}: AlertProps) {
  const alertClass = `alert-${type}`

  return (
    <div className={`${alertClass} ${className}`} {...props}>
      {children}
    </div>
  )
}
