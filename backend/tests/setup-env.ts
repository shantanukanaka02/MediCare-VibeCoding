process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ehcp_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET = "test_access_secret_that_is_long_enough_123";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_123";
process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";