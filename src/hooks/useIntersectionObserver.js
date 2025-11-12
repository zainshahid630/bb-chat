import { useEffect } from 'react'

/**
 * Hook to detect when an element enters the viewport
 * Useful for infinite scroll and lazy loading
 */
export const useIntersectionObserver = (ref, callback, options = {}) => {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [ref, callback, options])
}
