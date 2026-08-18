const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW || 1000);
        this.maxRequests = options.maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 10);
        this.store = new Map(); 
        this.redisClient = null;
        
        setInterval(() => this.cleanup(), 60000);
    }

   
    setRedisClient(redis) {
        this.redisClient = redis;
    }

    getKey(ip) {
        return `rate_limit:${ip}`;
    }

    getClientIp(req) {
        return (
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '127.0.0.1'
        );
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, data] of this.store.entries()) {
            if (data.resetTime < now) {
                this.store.delete(ip);
            }
        }
    }

    async checkMemoryStore(ip) {
        const now = Date.now();
        let data = this.store.get(ip);

        if (!data || data.resetTime < now) {
            // New window
            this.store.set(ip, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return { allowed: true, remaining: this.maxRequests - 1, resetIn: this.windowMs };
        }

        data.count++;
        const remaining = this.maxRequests - data.count;
        const allowed = data.count <= this.maxRequests;

        return {
            allowed,
            remaining: Math.max(0, remaining),
            resetIn: data.resetTime - now,
        };
    }

    async checkRedisStore(ip) {
        try {
            if (!this.redisClient) {
                return this.checkMemoryStore(ip);
            }

            const key = this.getKey(ip);
            const current = await this.redisClient.incr(key);

            if (current === 1) {
                await this.redisClient.expire(key, Math.ceil(this.windowMs / 1000));
            }

            const ttl = await this.redisClient.pttl(key);
            const remaining = Math.max(0, this.maxRequests - current);
            const allowed = current <= this.maxRequests;

            return {
                allowed,
                remaining,
                resetIn: ttl > 0 ? ttl : this.windowMs,
            };
        } catch (error) {
            logger.error(`Redis rate limiter error: ${error.message}`);
            return this.checkMemoryStore(ip);
        }
    }

    middleware() {
        return async (req, res, next) => {
            const ip = this.getClientIp(req);
            
            const limit = process.env.CLUSTER_MODE === 'true'
                ? await this.checkRedisStore(ip)
                : await this.checkMemoryStore(ip);

            res.set({
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': limit.remaining,
                'X-RateLimit-Reset': new Date(Date.now() + limit.resetIn).toISOString(),
            });

            if (!limit.allowed) {
                logger.warn(`Rate limit exceeded for IP: ${ip}`);
                return next(
                    new AppError(
                        `Too many requests from this IP (${this.maxRequests} per ${this.windowMs}ms). Please try again later.`,
                        429
                    )
                );
            }

            req.clientIp = ip;
            next();
        };
    }
}

module.exports = RateLimiter;
