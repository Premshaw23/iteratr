import React from 'react'

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export default function FormGroup({
  label,
  error,
  hint,
  required = false,
  className = '',
  children,
  ...props
}: FormGroupProps) {
  return (
    <div className={`form-group ${className}`} {...props}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  )
}
