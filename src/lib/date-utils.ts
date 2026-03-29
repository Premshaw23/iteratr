/**
 * Utility functions for standardized IST (Asia/Kolkata) time logic
 * to ensure consistency across Serverless Functions and Client Browsers.
 */

export function getISTDate(date: Date = new Date()): Date {
  const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  return new Date(utc + istOffset)
}

export function getISTDateString(date: Date = new Date()): string {
  const istDate = getISTDate(date)
  return istDate.toISOString().split('T')[0] // Format: YYYY-MM-DD
}

export function getYesterdayISTDateString(): string {
  const today = new Date()
  today.setDate(today.getDate() - 1)
  return getISTDateString(today)
}

export function formatISTTime(date: Date = new Date()): string {
  const istDate = getISTDate(date)
  return istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
