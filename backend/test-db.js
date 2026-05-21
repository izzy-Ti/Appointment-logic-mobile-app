const db = require('./config/db');

async function testConnection() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL ? 'URL from env' : 'Default config');
        const result = await db.raw('SELECT 1+1 AS result');
        console.log('Connection successful!', result.rows);
        
        const usersCount = await db('users').count('id as count').first();
        console.log('Users count:', usersCount.count);
        
        process.exit(0);
    } catch (err) {
        console.error('Connection failed!', err);
        process.exit(1);
    }
}

testConnection();
