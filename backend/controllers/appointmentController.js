const db = require('../config/db');

const requestAppointment = async (req, res) => {
    const { leader_id, start_time, end_time, reason } = req.body;
    const requester_id = req.user.id;

    try {
        // Auto-conflict check
        const conflict = await db('appointments')
            .where({ leader_id, status: 'confirmed' })
            .andWhere(function() {
                this.whereBetween('start_time', [start_time, end_time])
                    .orWhereBetween('end_time', [start_time, end_time]);
            }).first();

        const [newAppointment] = await db('appointments').insert({
            requester_id,
            leader_id,
            start_time,
            end_time,
            reason,
            status: conflict ? 'pending' : 'pending' // Always pending until secretary approves
        }).returning('*');

        // Fetch requester's name to display in the notification
        const requester = await db('users').where({ id: requester_id }).first();
        const requesterName = requester ? requester.name : 'A member';

        // Insert notification for the leader
        await db('notifications').insert({
            user_id: leader_id,
            message: `New appointment request from ${requesterName}: "${reason.substring(0, 40)}${reason.length > 40 ? '...' : ''}"`,
            type: 'appointment_request'
        });

        res.status(201).json({ 
            appointment: newAppointment, 
            potential_conflict: !!conflict 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAppointments = async (req, res) => {
    const { role, id } = req.user;
    try {
        let query = db('appointments')
            .join('users as requesters', 'appointments.requester_id', 'requesters.id')
            .join('users as leaders', 'appointments.leader_id', 'leaders.id')
            .select(
                'appointments.*', 
                'requesters.name as requester_name', 
                'leaders.name as leader_name'
            );

        if (role === 'leadership') {
            query = query.where({ leader_id: id });
        } else if (role === 'requester') {
            query = query.where({ requester_id: id });
        }
        // Secretaries see all for their assigned leadership levels (simplified here to all)

        const appointments = await query.orderBy('start_time', 'asc');
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, reschedule_reason, approval_notes, start_time, end_time } = req.body;
    
    try {
        const updateData = { status, updated_at: new Date() };
        if (reschedule_reason) updateData.reschedule_reason = reschedule_reason;
        if (approval_notes) updateData.approval_notes = approval_notes;
        if (start_time) updateData.start_time = start_time;
        if (end_time) updateData.end_time = end_time;

        const [updated] = await db('appointments')
            .where({ id })
            .update(updateData)
            .returning('*');

        // Notification logic would go here
        await db('notifications').insert({
            user_id: updated.requester_id,
            message: `Your appointment status has been updated to ${status}`,
            type: 'status_change'
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { requestAppointment, getAppointments, updateStatus };
