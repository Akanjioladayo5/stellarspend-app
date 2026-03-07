import React from 'react'

export function FieldGroup({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  )
}

export function FieldLabel({ htmlFor, children, className = '' }: { htmlFor?: string, children: React.ReactNode, className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium ${className}`}>
      {children}
    </label>
  )
}