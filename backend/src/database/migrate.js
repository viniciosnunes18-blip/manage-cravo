require('dotenv').config();
const pool = require('./pg');
const bcrypt = require('bcrypt');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email       TEXT UNIQUE NOT NULL,
        full_name   TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role        TEXT NOT NULL DEFAULT 'user',
        branch_id   TEXT,
        branch_name TEXT,
        first_access BOOLEAN DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity_type  TEXT NOT NULL,
        data         JSONB NOT NULL DEFAULT '{}',
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW(),
        created_by_id TEXT,
        deleted_at   TIMESTAMPTZ
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_entities_data ON entities USING gin(data)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_entities_not_deleted ON entities(entity_type) WHERE deleted_at IS NULL`);

    // Default admin user
    const existing = await client.query('SELECT id FROM auth_users WHERE email = $1', ['admin@cravodourado.com']);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO auth_users (email, full_name, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin@cravodourado.com', 'Administrador', hash, 'matriz']
      );
      console.log('Usuário admin criado: admin@cravodourado.com / admin123');
    }

    console.log('Migração concluída.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(e => { console.error(e); process.exit(1); });
