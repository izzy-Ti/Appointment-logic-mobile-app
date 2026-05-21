import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { Check, X, Calendar as CalendarIcon, Clock, User as UserIcon } from 'lucide-react-native';
import apiClient from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { Appointment } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'SecretaryDashboard'>;

const SecretaryDashboard = ({ navigation }: Props) => {
    const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);

    const fetchPending = useCallback(async () => {
        try {
            const response = await apiClient.get<Appointment[]>('/appointments');
            setPendingAppointments(response.data.filter((a) => a.status === 'pending'));
        } catch (error) {
            console.error(error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchPending();
        }, [fetchPending])
    );

    const handleAction = async (id: number, status: string) => {
        try {
            await apiClient.patch(`/appointments/${id}`, { status });
            Alert.alert('Success', `Appointment ${status}`);
            fetchPending();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const renderItem = ({ item }: { item: Appointment }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.requesterName}>{item.requester_name}</Text>
                <View style={styles.timeInfo}>
                    <Clock size={14} color={Colors.textMuted} />
                    <Text style={styles.timeText}>
                        {new Date(item.start_time).toLocaleDateString()}{' '}
                        {new Date(item.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>

            <Text style={styles.reason}>{item.reason}</Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.success + '20' }]}
                    onPress={() => handleAction(item.id, 'confirmed')}
                >
                    <Check size={20} color={Colors.success} />
                    <Text style={[styles.actionText, { color: Colors.success }]}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.error + '20' }]}
                    onPress={() => handleAction(item.id, 'canceled')}
                >
                    <X size={20} color={Colors.error} />
                    <Text style={[styles.actionText, { color: Colors.error }]}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.primary + '20' }]}
                    onPress={() => Alert.alert('Reschedule', 'Feature coming soon')}
                >
                    <CalendarIcon size={20} color={Colors.primary} />
                    <Text style={[styles.actionText, { color: Colors.primary }]}>Reschedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Secretary</Text>
                    <Text style={styles.subtitle}>{pendingAppointments.length} Pending Requests</Text>
                </View>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
                    <UserIcon color={Colors.text} size={22} />
                </TouchableOpacity>
            </View>

            <FlatList<Appointment>
                data={pendingAppointments}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Check size={48} color={Colors.success} />
                        <Text style={styles.emptyText}>All caught up!</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    iconButton: {
        backgroundColor: Colors.surface,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        marginTop: 4,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    requesterName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: Colors.textMuted,
        marginLeft: 4,
    },
    reason: {
        fontSize: 14,
        color: Colors.textMuted,
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: Colors.text,
        fontSize: 18,
        marginTop: 16,
    },
});

export default SecretaryDashboard;
