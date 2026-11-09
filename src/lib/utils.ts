import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(d)
  } catch {
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return d.toLocaleString('en-GB')
  }
}

export function formatTimeLeft(endTime: Date): string {
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()
  if (diff <= 0) return '00:00'
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function generateRegistrationRef(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `NEX-${year}-${rand}`
}

export function getTeamStatusColor(status: string): string {
  const colors: Record<string, string> = {
    approved: 'badge-status-approved',
    rejected: 'badge-status-rejected',
    submitted: 'badge-status-submitted',
    under_review: 'badge-status-under_review',
    waitlisted: 'badge-status-waitlisted',
    disqualified: 'badge-status-disqualified',
    draft: 'badge-status-draft',
  }
  return colors[status] ?? 'badge-status-draft'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
