import { useContext } from 'react'
import { NotificationContext } from '@/context/NotificationContext'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const { addNotification } = useContext(NotificationContext)!

  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const type = variant === 'destructive' ? 'error' : 'success'
    const message = description ? `${title}: ${description}` : title
    addNotification(type, message)
  }

  return { toast }
}