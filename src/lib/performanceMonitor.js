/**
 * Performance monitoring utilities
 * Track page load, API calls, and component renders
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      apiCalls: [],
      renders: [],
    }
    this.init()
  }

  init() {
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageLoad()
      })
    }
  }

  trackPageLoad() {
    const perfData = performance.getEntriesByType('navigation')[0]
    
    if (perfData) {
      this.metrics.pageLoad = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart,
      }

      console.log('📊 Page Load Performance:', this.metrics.pageLoad)
    }
  }

  trackAPICall(url, duration, status) {
    const call = {
      url,
      duration,
      status,
      timestamp: Date.now(),
    }

    this.metrics.apiCalls.push(call)

    // Keep only last 100 calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift()
    }

    // Warn on slow API calls
    if (duration > 1000) {
      console.warn(`⚠️ Slow API call: ${url} took ${duration}ms`)
    }
  }

  trackRender(componentName, duration) {
    const render = {
      component: componentName,
      duration,
      timestamp: Date.now(),
    }

    this.metrics.renders.push(render)

    // Keep only last 50 renders
    if (this.metrics.renders.length > 50) {
      this.metrics.renders.shift()
    }

    // Warn on slow renders
    if (duration > 16) {
      console.warn(`⚠️ Slow render: ${componentName} took ${duration}ms`)
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgAPITime: this.getAverageAPITime(),
      avgRenderTime: this.getAverageRenderTime(),
    }
  }

  getAverageAPITime() {
    if (this.metrics.apiCalls.length === 0) return 0
    const total = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0)
    return Math.round(total / this.metrics.apiCalls.length)
  }

  getAverageRenderTime() {
    if (this.metrics.renders.length === 0) return 0
    const total = this.metrics.renders.reduce((sum, render) => sum + render.duration, 0)
    return Math.round(total / this.metrics.renders.length)
  }

  logSummary() {
    console.log('📊 Performance Summary:', {
      pageLoad: this.metrics.pageLoad?.total + 'ms',
      avgAPITime: this.getAverageAPITime() + 'ms',
      avgRenderTime: this.getAverageRenderTime() + 'ms',
      totalAPICalls: this.metrics.apiCalls.length,
      totalRenders: this.metrics.renders.length,
    })
  }
}

// Export singleton
export const performanceMonitor = new PerformanceMonitor()

// Utility to wrap async functions with performance tracking
export const trackAsync = (name, fn) => {
  return async (...args) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const duration = performance.now() - start
      performanceMonitor.trackAPICall(name, duration, 'success')
      return result
    } catch (error) {
      const duration = performance.now() - start
      performanceMonitor.trackAPICall(name, duration, 'error')
      throw error
    }
  }
}
