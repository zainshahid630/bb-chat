// Performance monitoring middleware
import os from 'os'

class PerformanceMonitor {
  constructor() {
    this.requestCount = 0
    this.totalResponseTime = 0
    this.slowQueries = []
    this.errorCount = 0
    this.activeConnections = 0
    this.startTime = Date.now()
    
    // Memory and CPU monitoring
    this.memoryUsage = []
    this.cpuUsage = []
    
    // Start monitoring
    this.startSystemMonitoring()
  }

  // Middleware for request timing and monitoring
  requestTimer() {
    return (req, res, next) => {
      const startTime = Date.now()
      this.activeConnections++
      
      // Override res.end to capture response time
      const originalEnd = res.end
      res.end = (...args) => {
        const responseTime = Date.now() - startTime
        this.requestCount++
        this.totalResponseTime += responseTime
        this.activeConnections--
        
        // Log slow requests
        if (responseTime > 1000) { // Slower than 1 second
          this.slowQueries.push({
            method: req.method,
            url: req.url,
            responseTime,
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip
          })
          
          // Keep only last 100 slow queries
          if (this.slowQueries.length > 100) {
            this.slowQueries = this.slowQueries.slice(-100)
          }
          
          console.warn(`🐌 Slow request: ${req.method} ${req.url} - ${responseTime}ms`)
        }
        
        // Log request details
        console.log(`📊 ${req.method} ${req.url} - ${responseTime}ms - ${res.statusCode}`)
        
        originalEnd.apply(res, args)
      }
      
      next()
    }
  }

  // Error tracking middleware
  errorTracker() {
    return (err, req, res, next) => {
      this.errorCount++
      
      console.error(`❌ Error in ${req.method} ${req.url}:`, err.message)
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal server error' })
      } else {
        res.status(500).json({ 
          error: err.message,
          stack: err.stack 
        })
      }
    }
  }

  // Start system monitoring
  startSystemMonitoring() {
    setInterval(() => {
      // Memory usage
      const memUsage = process.memoryUsage()
      this.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss / 1024 / 1024, // MB
        heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
        heapTotal: memUsage.heapTotal / 1024 / 1024, // MB
        external: memUsage.external / 1024 / 1024 // MB
      })
      
      // Keep only last 60 measurements (1 hour if measured every minute)
      if (this.memoryUsage.length > 60) {
        this.memoryUsage = this.memoryUsage.slice(-60)
      }
      
      // CPU usage
      const cpus = os.cpus()
      const cpuCount = cpus.length
      let totalIdle = 0
      let totalTick = 0
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type]
        }
        totalIdle += cpu.times.idle
      })
      
      const idle = totalIdle / cpuCount
      const total = totalTick / cpuCount
      const usage = 100 - ~~(100 * idle / total)
      
      this.cpuUsage.push({
        timestamp: Date.now(),
        usage: usage
      })
      
      // Keep only last 60 measurements
      if (this.cpuUsage.length > 60) {
        this.cpuUsage = this.cpuUsage.slice(-60)
      }
      
    }, 60000) // Every minute
  }

  // Get performance statistics
  getStats() {
    const uptime = Date.now() - this.startTime
    const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
    
    const latestMemory = this.memoryUsage[this.memoryUsage.length - 1]
    const latestCpu = this.cpuUsage[this.cpuUsage.length - 1]
    
    return {
      uptime: {
        ms: uptime,
        human: this.formatUptime(uptime)
      },
      requests: {
        total: this.requestCount,
        active: this.activeConnections,
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerSecond: Math.round(this.requestCount / (uptime / 1000))
      },
      errors: {
        total: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
      },
      performance: {
        slowQueries: this.slowQueries.length,
        recentSlowQueries: this.slowQueries.slice(-5)
      },
      system: {
        memory: latestMemory ? {
          rss: `${latestMemory.rss.toFixed(2)} MB`,
          heapUsed: `${latestMemory.heapUsed.toFixed(2)} MB`,
          heapTotal: `${latestMemory.heapTotal.toFixed(2)} MB`
        } : null,
        cpu: latestCpu ? `${latestCpu.usage}%` : null,
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version
      }
    }
  }

  // Format uptime in human readable format
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Reset statistics
  reset() {
    this.requestCount = 0
    this.totalResponseTime = 0
    this.slowQueries = []
    this.errorCount = 0
    this.startTime = Date.now()
    this.memoryUsage = []
    this.cpuUsage = []
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()
export default performanceMonitor