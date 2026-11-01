export function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
