const { neon, neonConfig } = require('@neondatabase/serverless');

neonConfig.fetchConnectionCache = true;

// Pooled connection — use for all app queries
const sql = neon(process.env.DATABASE_URL);

// Unpooled connection — use only for migrations (DDL statements)
const sqlUnpooled = neon(process.env.DATABASE_URL_UNPOOLED);

module.exports = { sql, sqlUnpooled };
