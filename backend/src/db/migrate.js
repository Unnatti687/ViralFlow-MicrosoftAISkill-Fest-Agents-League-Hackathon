require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sqlUnpooled } = require('./client');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    const statements = sql
      .split(';')
      .map((s) =>
        s
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
      )
      .filter((s) => s.length > 0);
    for (const statement of statements) {
      await sqlUnpooled(statement);
    }
    console.log(`Done: ${file}`);
  }

  console.log('All migrations complete');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
