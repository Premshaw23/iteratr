import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  disabled?: boolean
}

export default function Input({
  error = false,
  disabled = false,
  className = '',
  ...props
}: InputProps) {
  let inputClass = 'input'
  if (error) inputClass = 'input-error'
  if (disabled) inputClass = 'input-disabled'

  return <input className={`${inputClass} ${className}`} disabled={disabled} {...props} />
}
