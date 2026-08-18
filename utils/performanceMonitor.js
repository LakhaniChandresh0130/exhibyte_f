const logger = require('./logger');

class PerformanceMonitor {
    constructor(slowRequestThreshold = 50) {
        this.slowRequestThreshold = slowRequestThreshold; 
        this.metrics = {
            totalRequests: 0,
            totalResponseTime: 0,
            slowRequests: 0,
            fastRequests: 0,
        };
    }

    middleware() {
        return (req, res, next) => {
            const startTime = process.hrtime.bigint();
            const startMs = Date.now();

            // Override res.json to capture response sending
            const originalJson = res.json;
            const resRef = res;

            res.json = (data) => {
                const endTime = process.hrtime.bigint();
                const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms

                resRef.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);

                // Update metrics
                this.metrics = this.metrics || {};
                this.metrics.totalRequests = (this.metrics.totalRequests || 0) + 1;
                this.metrics.totalResponseTime = (this.metrics.totalResponseTime || 0) + responseTime;

                if (responseTime > this.slowRequestThreshold) {
                    this.metrics.slowRequests = (this.metrics.slowRequests || 0) + 1;
                    logger.warn(
                        `Slow request: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms ` +
                        `(threshold: ${this.slowRequestThreshold}ms)`
                    );
                } else {
                    this.metrics.fastRequests = (this.metrics.fastRequests || 0) + 1;
                }

                logger.debug(
                    `${req.method} ${req.path} - ${resRef.statusCode} - ${responseTime.toFixed(2)}ms`
                );

                // Store in app locals for access
                if (req.app && req.app.locals) {
                    req.app.locals.lastMetrics = this.metrics;
                }

                return originalJson.call(resRef, data);
            };


            next();
        };
    }

    getMetrics() {
        const avgResponseTime = this.metrics.totalRequests > 0
            ? (this.metrics.totalResponseTime / this.metrics.totalRequests).toFixed(2)
            : 0;

        return {
            totalRequests: this.metrics.totalRequests,
            averageResponseTime: `${avgResponseTime}ms`,
            slowRequests: this.metrics.slowRequests,
            fastRequests: this.metrics.fastRequests,
            slowRequestPercentage: this.metrics.totalRequests > 0
                ? ((this.metrics.slowRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
                : '0%',
        };
    }

    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            totalResponseTime: 0,
            slowRequests: 0,
            fastRequests: 0,
        };
    }
}

module.exports = PerformanceMonitor;
