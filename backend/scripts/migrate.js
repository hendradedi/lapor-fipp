import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const migrations = [
  {
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        display_name VARCHAR(255),
        auth_provider VARCHAR(50) DEFAULT 'email',
        role VARCHAR(50) DEFAULT 'REPORTER',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `
  },
  {
    name: 'create_reports_table',
    sql: `
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_type VARCHAR(50) NOT NULL,
        reporter_name VARCHAR(255) NOT NULL,
        contact VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        anonymous_limited BOOLEAN DEFAULT false,
        contact_masked VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        sub_category VARCHAR(255) NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        urgency_score INTEGER DEFAULT 45,
        sentiment VARCHAR(50) DEFAULT 'NORMAL',
        status VARCHAR(50) DEFAULT 'BARU',
        assigned_unit VARCHAR(100),
        sla_due_at TIMESTAMP,
        created_by VARCHAR(255),
        reporter_auth_provider VARCHAR(50),
        reporter_uid VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_urgency ON reports(urgency_score DESC);
    `
  },
  {
    name: 'create_report_timeline_table',
    sql: `
      CREATE TABLE IF NOT EXISTS report_timeline (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        note TEXT,
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_timeline_report_id ON report_timeline(report_id);
      CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON report_timeline(created_at DESC);
    `
  },
  {
    name: 'create_settings_table',
    sql: `
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_by VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Insert default SLA config
      INSERT INTO app_settings (key, value, updated_by) 
      VALUES (
        'sla_config',
        '{"defaultHours": 72, "message": "SLA ditentukan admin sesuai tingkat kesulitan."}'::jsonb,
        'system'
      ) ON CONFLICT (key) DO NOTHING;
      
      -- Insert default admin policy
      INSERT INTO app_settings (key, value, updated_by) 
      VALUES (
        'admin_policy',
        '{"primaryAdminEmail": "fipp@mail.unnes.ac.id", "assistantEmails": []}'::jsonb,
        'system'
      ) ON CONFLICT (key) DO NOTHING;
    `
  },
  {
    name: 'create_sessions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `
  }
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    for (const migration of migrations) {
      // Check if migration already executed
      const result = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [migration.name]
      );
      
      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping migration: ${migration.name} (already executed)`);
        continue;
      }
      
      console.log(`▶️  Running migration: ${migration.name}`);
      
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`✅ Completed migration: ${migration.name}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('✨ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
