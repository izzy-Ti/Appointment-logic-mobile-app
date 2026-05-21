const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    try {
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Running schema.sql...');
        await db.raw(sql);
        console.log('Schema executed successfully!');
        
        process.exit(0);
    } catch (err) {
        console.error('Error running schema:', err);
        process.exit(1);
    }
}

runSchema();
