const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sanitizeUser = (user) => {
    if (!user) return user;
    const { password, ...safe } = user;
    return safe;
};

const register = async (req, res) => {
    const { name, email, password, role, leadership_level } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [newUser] = await db('users').insert({
            name,
            email,
            password: hashedPassword,
            role: role || 'requester',
            leadership_level: leadership_level || 0
        }).returning('*');

        const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ user: sanitizeUser(newUser), token });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'That email is already registered.' });
        }
        console.error('register error', err);
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db('users').where({ email }).first();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: sanitizeUser(user), token });
    } catch (err) {
        console.error('login error', err);
        res.status(500).json({ error: err.message });
    }
};

const getLeaders = async (req, res) => {
    try {
        const leaders = await db('users')
            .where({ role: 'leadership' })
            .select('id', 'name', 'leadership_level')
            .orderBy('leadership_level', 'desc');
        res.json(leaders);
    } catch (err) {
        console.error('getLeaders error', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login, getLeaders };
