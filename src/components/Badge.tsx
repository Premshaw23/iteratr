import React from 'react'

type BadgeColor = 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'gray'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
  children: React.ReactNode
}

export default function Badge({
  color = 'blue',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const colorClass = `badge-${color}`

  return (
    <span className={`${colorClass} ${className}`} {...props}>
      {children}
    </span>
  )
}
