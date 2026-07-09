require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
};

const pool = new Pool(poolConfig);

async function main() {
  console.log("Flushing database (except Users and Auth)...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all dependent records first
    await client.query('DELETE FROM "ExamRecord"');
    await client.query('DELETE FROM "Attendance"');
    await client.query('DELETE FROM "CareerRecord"');
    await client.query('DELETE FROM "RecordAuditLog"');
    await client.query('DELETE FROM "Notification"');
    await client.query('DELETE FROM "AccessLog"');
    
    // Delete main operational entities
    await client.query('DELETE FROM "Job"');
    await client.query('DELETE FROM "SyllabusPlan"');
    
    // Delete profiles and cohorts
    await client.query('DELETE FROM "_StudentCohorts"');
    await client.query('DELETE FROM "Cohort"');
    await client.query('DELETE FROM "Profile"');
    await client.query('DELETE FROM "StaffRecord"');

    await client.query('COMMIT');
    console.log("Database flushed successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
  }
}

main().then(() => process.exit(0));
