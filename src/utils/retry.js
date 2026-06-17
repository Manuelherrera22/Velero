/**
 * Retry utility for async operations
 * Retries a function up to maxRetries times with exponential backoff
 */
export async function withRetry(fn, { maxRetries = 2, baseDelay = 800, label = 'fetch' } = {}) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) // 800ms, 1600ms
        console.warn(`[${label}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, err.message)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}
