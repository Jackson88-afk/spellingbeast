'use strict';

const { Pool } = require('pg');

const TRANSIENT_CODES = new Set(['08000', '08001', '08003', '08006', '57P01', '57P02', '57P03', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT']);

function isTransient(error) {
  return TRANSIENT_CODES.has(error?.code) || /timeout|connection terminated|connection closed/i.test(String(error?.message || ''));
}

async function withRetry(operation, { attempts = 3, delayMs = 150 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransient(error) || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

function createDatabasePool(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  });
  return {
    connect: () => withRetry(() => pool.connect()),
    query: (...args) => withRetry(() => pool.query(...args)),
    end: () => pool.end(),
  };
}

module.exports = { createDatabasePool, isTransient, withRetry };
