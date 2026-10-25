export function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function hasItems(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0
}
