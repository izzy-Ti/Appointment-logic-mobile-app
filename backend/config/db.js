const knex = require('knex');
const dotenv = require('dotenv');

dotenv.config();

// If DATABASE_URL fails to connect, ensure special characters in the password are URL-encoded (e.g. @ -> %40).
const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL || {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'university_appointments'
    }
});

module.exports = db;
