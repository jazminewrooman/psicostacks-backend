export function randomId(prefix = '') {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`
}
