import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Modal,
    FlatList,
    RefreshControl,
    Platform,
    StatusBar,
    Animated
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { Bell, Plus, X, Check, Calendar as CalendarIcon, Clock, LogOut, User as UserIcon } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import apiClient from '../api/client';
import AppointmentCard from '../components/AppointmentCard';
import type { RootStackParamList } from '../navigation/types';
import type { Appointment, User, Notification } from '../types/models';

const getLocalDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type FilterType = 'calendar' | 'upcoming' | 'pending' | 'total';

const DashboardScreen = ({ navigation }: Props) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState<User['role'] | ''>('');
    const [activeTab, setActiveTab] = useState<'schedule' | 'approvals'>('schedule');
    
    // Interactive states
    const [activeFilter, setActiveFilter] = useState<FilterType>('calendar');
    const [refreshing, setRefreshing] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Pulse animation
    const pulseAnim = React.useRef(new Animated.Value(0.1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [pulseAnim]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                const raw = await AsyncStorage.getItem('user');
                if (cancelled || !raw) return;
                try {
                    const u = JSON.parse(raw) as User;
                    setUserName(u.name || 'Member');
                    setUserRole(u.role);
                } catch {
                    setUserName('Member');
                }
            })();
            return () => {
                cancelled = true;
            };
        }, [])
    );

    const fetchData = useCallback(async () => {
        try {
            const [appRes, notifRes] = await Promise.all([
                apiClient.get<Appointment[]>('/appointments'),
                apiClient.get<Notification[]>('/notifications').catch(() => ({ data: [] }))
            ]);
            setAppointments(appRes.data);
            if (notifRes.data) {
                setNotifications(notifRes.data);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleAction = async (id: number, status: string) => {
        try {
            await apiClient.patch(`/appointments/${id}`, { status });
            fetchData();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const markNotificationRead = async (id: number) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Log Out', 
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    navigation.replace('Login');
                }
            }
        ]);
    };

    const markedDates = appointments.reduce<Record<string, object>>((acc, app) => {
        const date = getLocalDateString(app.start_time);
        acc[date] = { marked: true, dotColor: Colors.primary };
        return acc;
    }, {});

    markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: Colors.primary,
    };

    const subtitle =
        userRole === 'leadership'
            ? "President's Office"
            : userRole === 'requester'
              ? 'Your appointments'
              : 'Schedule';

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    const upcomingAppointments = appointments.filter(a => a.status === 'confirmed');

    // Find "Up Next" meeting
    const now = new Date();
    const futureConfirmed = upcomingAppointments.filter(a => new Date(a.start_time) > now);
    futureConfirmed.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const upNext = futureConfirmed[0];

    const toggleFilter = (filter: FilterType) => {
        setActiveFilter(prev => prev === filter ? 'calendar' : filter);
    };

    const renderApprovalCard = ({ item }: { item: Appointment }) => (
        <View style={styles.approvalCard} key={item.id}>
            <View style={styles.approvalHeader}>
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
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{userName || '…'}</Text>
                    <Text style={styles.roleLine}>{subtitle}</Text>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={[styles.iconButton, { marginRight: 12 }]} onPress={() => setShowNotifications(true)}>
                        <Bell color={Colors.text} size={22} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
                        <UserIcon color={Colors.text} size={22} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Up Next Banner */}
                {upNext && activeTab === 'schedule' && (
                    <View style={styles.upNextBanner}>
                        <Animated.View style={[styles.upNextGlow, { opacity: pulseAnim }]} />
                        <View style={styles.upNextContent}>
                            <Text style={styles.upNextTitle}>UP NEXT</Text>
                            <Text style={styles.upNextName}>{upNext.requester_name || upNext.leader_name || 'Meeting'}</Text>
                            <View style={styles.upNextTimeRow}>
                                <Clock size={14} color={Colors.text} />
                                <Text style={styles.upNextTimeText}>
                                    {new Date(upNext.start_time).toLocaleDateString()} at {new Date(upNext.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Glassmorphic Interactive Stats Row */}
                <View style={styles.statsRow}>
                    <TouchableOpacity 
                        style={[styles.statCard, activeFilter === 'upcoming' && styles.statCardActive]} 
                        onPress={() => toggleFilter('upcoming')}
                    >
                        <Text style={[styles.statValue, activeFilter === 'upcoming' && styles.statValueActive]}>{upcomingAppointments.length}</Text>
                        <Text style={[styles.statLabel, activeFilter === 'upcoming' && styles.statLabelActive]}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.statCard, activeFilter === 'pending' && styles.statCardActive]} 
                        onPress={() => toggleFilter('pending')}
                    >
                        <Text style={[styles.statValue, activeFilter === 'pending' && styles.statValueActive]}>{pendingAppointments.length}</Text>
                        <Text style={[styles.statLabel, activeFilter === 'pending' && styles.statLabelActive]}>Pending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.statCard, activeFilter === 'total' && styles.statCardActive]} 
                        onPress={() => toggleFilter('total')}
                    >
                        <Text style={[styles.statValue, activeFilter === 'total' && styles.statValueActive]}>{appointments.length}</Text>
                        <Text style={[styles.statLabel, activeFilter === 'total' && styles.statLabelActive]}>Total</Text>
                    </TouchableOpacity>
                </View>

                {/* Segmented Control for Leaders/Secretaries */}
                {(userRole === 'leadership' || userRole === 'secretary') && (
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[styles.segmentButton, activeTab === 'schedule' && styles.segmentActive]}
                            onPress={() => {
                                setActiveTab('schedule');
                                setActiveFilter('calendar');
                            }}
                        >
                            <Text style={[styles.segmentText, activeTab === 'schedule' && styles.segmentTextActive]}>My Schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentButton, activeTab === 'approvals' && styles.segmentActive]}
                            onPress={() => {
                                setActiveTab('approvals');
                                setActiveFilter('calendar');
                            }}
                        >
                            <Text style={[styles.segmentText, activeTab === 'approvals' && styles.segmentTextActive]}>
                                Approvals {pendingAppointments.length > 0 ? `(${pendingAppointments.length})` : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'schedule' ? (
                    <>
                        {activeFilter === 'calendar' ? (
                            <View style={styles.calendarContainer}>
                                <Calendar
                                    theme={{
                                        backgroundColor: Colors.surface,
                                        calendarBackground: Colors.surface,
                                        textSectionTitleColor: Colors.textMuted,
                                        selectedDayBackgroundColor: Colors.primary,
                                        selectedDayTextColor: Colors.text,
                                        todayTextColor: Colors.accent,
                                        dayTextColor: Colors.text,
                                        textDisabledColor: Colors.textMuted,
                                        monthTextColor: Colors.text,
                                        indicatorColor: Colors.primary,
                                    }}
                                    onDayPress={(day) => setSelectedDate(day.dateString)}
                                    markedDates={markedDates}
                                />
                            </View>
                        ) : (
                            <View style={styles.filterHeader}>
                                <Text style={styles.filterTitle}>
                                    {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Appointments
                                </Text>
                            </View>
                        )}

                        {activeFilter === 'calendar' && (
                            <View style={styles.appointmentHeader}>
                                <Text style={styles.sectionTitle}>Appointments for {selectedDate}</Text>
                                {(userRole === 'requester' || userRole === 'leadership') && (
                                    <TouchableOpacity onPress={() => navigation.navigate('RequestAppointment')}>
                                        <Plus color={Colors.primary} size={24} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <View style={styles.listContainer}>
                            {appointments
                                .filter((app) => {
                                    if (activeFilter === 'calendar') return getLocalDateString(app.start_time) === selectedDate;
                                    if (activeFilter === 'upcoming') return app.status === 'confirmed';
                                    if (activeFilter === 'pending') return app.status === 'pending';
                                    return true; // total
                                })
                                .map((app) => (
                                    <AppointmentCard key={app.id} appointment={app} userRole={userRole} />
                                ))}
                                
                            {appointments.filter((app) => {
                                    if (activeFilter === 'calendar') return getLocalDateString(app.start_time) === selectedDate;
                                    if (activeFilter === 'upcoming') return app.status === 'confirmed';
                                    if (activeFilter === 'pending') return app.status === 'pending';
                                    return true;
                                }).length === 0 && (
                                <Text style={styles.noAppointments}>No appointments found.</Text>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.listContainer}>
                        {pendingAppointments.map(app => renderApprovalCard({ item: app }))}
                        {pendingAppointments.length === 0 && (
                            <View style={styles.empty}>
                                <Check size={48} color={Colors.success} />
                                <Text style={styles.emptyText}>All caught up!</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Notifications Drawer Overlay */}
            <Modal
                visible={showNotifications}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.drawer}>
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Notifications</Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <X color={Colors.text} size={24} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.notificationCard, !item.is_read && styles.notificationUnread]}
                                    onPress={() => markNotificationRead(item.id)}
                                >
                                    <View style={styles.notificationContent}>
                                        <Text style={[styles.notificationText, !item.is_read && styles.notificationTextUnread]}>
                                            {item.message}
                                        </Text>
                                        <Text style={styles.notificationTime}>
                                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                        </Text>
                                    </View>
                                    {!item.is_read && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.noAppointments}>No recent notifications.</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 16,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    greeting: {
        color: Colors.textMuted,
        fontSize: 16,
    },
    userName: {
        color: Colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    roleLine: {
        color: Colors.textMuted,
        fontSize: 14,
        marginTop: 4,
    },
    iconButton: {
        backgroundColor: Colors.surface,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: Colors.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.background,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    upNextBanner: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        padding: 1, // for border gradient effect wrapper
        position: 'relative',
        backgroundColor: Colors.primary + '20',
        borderWidth: 1,
        borderColor: Colors.primary,
        overflow: 'hidden',
    },
    upNextGlow: {
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        backgroundColor: Colors.primary,
        opacity: 0.1,
    },
    upNextContent: {
        padding: 16,
    },
    upNextTitle: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    upNextName: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    upNextTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    upNextTimeText: {
        color: Colors.text,
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        alignItems: 'center',
    },
    statCardActive: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    statValue: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    statValueActive: {
        color: Colors.primary,
    },
    statLabel: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    statLabelActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    segmentedControl: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginBottom: 16,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentActive: {
        backgroundColor: Colors.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentText: {
        color: Colors.textMuted,
        fontWeight: '600',
        fontSize: 14,
    },
    segmentTextActive: {
        color: Colors.text,
    },
    calendarContainer: {
        marginHorizontal: 24,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    filterHeader: {
        paddingHorizontal: 24,
        paddingBottom: 10,
    },
    filterTitle: {
        color: Colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 10,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    noAppointments: {
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
    approvalCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    approvalHeader: {
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
        paddingVertical: 10,
        borderRadius: 12,
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    empty: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: Colors.text,
        fontSize: 18,
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    drawer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        height: '80%',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    drawerTitle: {
        color: Colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    notificationUnread: {
        backgroundColor: Colors.primary + '15',
        borderColor: Colors.primary + '40',
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        color: Colors.textMuted,
        fontSize: 15,
        lineHeight: 22,
    },
    notificationTextUnread: {
        color: Colors.text,
        fontWeight: '600',
    },
    notificationTime: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 8,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
        marginLeft: 12,
    },
});

export default DashboardScreen;
