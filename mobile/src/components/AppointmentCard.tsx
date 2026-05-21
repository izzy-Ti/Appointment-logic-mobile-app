import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Colors } from '../theme/colors';
import { Clock, User, ChevronRight, Share2 } from 'lucide-react-native';
import type { Appointment } from '../types/models';

type Props = { appointment: Appointment, userRole?: string };

const AppointmentCard = ({ appointment, userRole = 'requester' }: Props) => {
    const startTime = new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(appointment.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(appointment.start_time).toLocaleDateString();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return Colors.success;
            case 'pending': return Colors.warning;
            case 'canceled': return Colors.error;
            case 'rescheduled': return Colors.primary;
            default: return Colors.textMuted;
        }
    };

    const displayName = userRole === 'requester' 
        ? `With ${appointment.leader_name ?? 'Leader'}` 
        : (appointment.requester_name ?? 'Unknown');

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I have an appointment: ${displayName} on ${dateStr} from ${startTime} to ${endTime}. Reason: ${appointment.reason}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <TouchableOpacity style={styles.container}>
            <View style={styles.timeContainer}>
                <Clock color={Colors.textMuted} size={16} />
                <Text style={styles.timeText}>{startTime} - {endTime}</Text>
            </View>
            
            <View style={styles.content}>
                <View style={styles.userInfo}>
                    <User color={Colors.primary} size={20} style={styles.userIcon} />
                    <View style={styles.textStack}>
                        <Text style={styles.requesterName} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <Text style={styles.reason} numberOfLines={1}>{appointment.reason}</Text>
                    </View>
                </View>
                
                <View style={styles.footerRow}>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(appointment.status ?? 'pending') + '20' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                { color: getStatusColor(appointment.status ?? 'pending') },
                            ]}
                        >
                            {(appointment.status ?? 'pending').toUpperCase()}
                        </Text>
                    </View>

                    {appointment.status === 'confirmed' && (
                        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                            <Share2 color={Colors.primary} size={16} />
                            <Text style={styles.shareText}>Share</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        top: 12,
        right: 16,
    },
    timeText: {
        color: Colors.textMuted,
        fontSize: 12,
        marginLeft: 4,
    },
    content: {
        flex: 1,
        marginTop: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userIcon: {
        marginRight: 12,
    },
    textStack: {
        flex: 1,
    },
    requesterName: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    reason: {
        color: Colors.textMuted,
        fontSize: 14,
        marginTop: 2,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    shareText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default AppointmentCard;
