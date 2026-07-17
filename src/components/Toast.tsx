import { useEffect, useState, useCallback } from 'react'
import { create } from 'zustand'
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react'
import { Text, ActionIcon } from '@mantine/core'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

let toastId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 3500) => {
    const id = `toast-${++toastId}`
    set((s) => ({
      toasts: [...s.toasts.slice(-4), { id, type, message, duration }],
    }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export function useToast() {
  const addToast = useToastStore((s) => s.addToast)
  return {
    success: useCallback((msg: string) => addToast('success', msg), [addToast]),
    error: useCallback((msg: string) => addToast('error', msg), [addToast]),
    info: useCallback((msg: string) => addToast('info', msg), [addToast]),
    warning: useCallback((msg: string) => addToast('warning', msg), [addToast]),
  }
}

const ICONS: Record<ToastType, typeof IconCheck> = {
  success: IconCheck,
  error: IconX,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
}

const COLORS: Record<ToastType, string> = {
  success: 'var(--mantine-color-green-5)',
  error: 'var(--mantine-color-red-5)',
  info: 'var(--mantine-color-blue-5)',
  warning: 'var(--mantine-color-yellow-5)',
}

const BGS: Record<ToastType, string> = {
  success: 'rgba(34, 197, 94, 0.08)',
  error: 'rgba(239, 68, 68, 0.08)',
  info: 'rgba(59, 130, 246, 0.08)',
  warning: 'rgba(234, 179, 8, 0.08)',
}

function ToastItemComponent({ toast }: { toast: ToastItem }) {
  const [exiting, setExiting] = useState(false)
  const remove = useToastStore((s) => s.removeToast)
  const Icon = ICONS[toast.type]

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => setExiting(true), toast.duration - 250)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => remove(toast.id), 250)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 'var(--wb-radius)',
        backgroundColor: 'var(--wb-glass-bg)',
        backdropFilter: 'var(--wb-glass-blur)',
        WebkitBackdropFilter: 'var(--wb-glass-blur)',
        border: '1px solid var(--wb-glass-border)',
        boxShadow: 'var(--wb-shadow-lg)',
        minWidth: 260,
        maxWidth: 380,
        animation: `${exiting ? 'toast-exit' : 'toast-enter'} 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: BGS[toast.type],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={14} color={COLORS[toast.type]} />
      </div>
      <Text size="sm" style={{ flex: 1, lineHeight: 1.4, color: 'var(--wb-text)' }}>
        {toast.message}
      </Text>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="xs"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <IconX size={12} />
      </ActionIcon>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateX(20px) scale(0.97); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toast-exit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(20px) scale(0.97); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItemComponent key={t.id} toast={t} />
        ))}
      </div>
    </>
  )
}
