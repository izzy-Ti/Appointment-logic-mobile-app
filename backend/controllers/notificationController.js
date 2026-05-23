const db = require('../config/db');

const getNotifications = async (req, res) => {
    const user_id = req.user.id;
    try {
        const notifications = await db('notifications')
            .where({ user_id })
            .orderBy('created_at', 'desc')
            .limit(50);
        res.json(notifications);
    } catch (err) {
        console.error('getNotifications error', err);
        res.status(500).json({ error: err.message });
    }
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [updated] = await db('notifications')
            .where({ id, user_id })
            .update({ is_read: true })
            .returning('*');
        
        if (!updated) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(updated);
    } catch (err) {
        console.error('markAsRead error', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getNotifications, markAsRead };
