export type UserRole = 'leadership' | 'secretary' | 'requester';

export type AppointmentStatus = 'pending' | 'confirmed' | 'canceled' | 'rescheduled';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    leadership_level?: number;
}

export interface Appointment {
    id: number;
    requester_id?: number;
    leader_id?: number;
    start_time: string;
    end_time: string;
    reason: string;
    status: AppointmentStatus;
    requester_name?: string;
    leader_name?: string;
}

export interface Notification {
    id: number;
    user_id: number;
    message: string;
    is_read: boolean;
    type: string;
    created_at: string;
}
