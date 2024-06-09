import Redis from 'ioredis';

// Get the Redis host from the environment variables
const redisHost = process.env.REDIS_HOST || 'localhost';
export const redis = new Redis({
  host: redisHost,
  port: 6379 // Default Redis port
});