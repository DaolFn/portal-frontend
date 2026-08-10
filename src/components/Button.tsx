import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'bg-surface text-ink border border-line hover:bg-line',
  danger: 'bg-danger text-accent-ink hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
