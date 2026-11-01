import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className="ui-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
          {props.required && <span className="ui-input-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={`ui-input-box ${error ? 'has-error' : ''} ${className}`}>
        {leftIcon && <span className="ui-input-icon left" aria-hidden="true">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className="ui-input-field"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightIcon && <span className="ui-input-icon right" aria-hidden="true">{rightIcon}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="ui-input-message error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="ui-input-message helper">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
