import React from 'react'

type CardVariant = 'default' | 'hover' | 'elevated'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: React.ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: 'card',
  hover: 'card-hover',
  elevated: 'card-elevated',
}

export default function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClass = variantClasses[variant]

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  )
}
