import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { Colors } from '../theme/colors';
import apiClient from '../api/client';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestAppointment'>;

const RequestAppointmentScreen = ({ navigation }: Props) => {
    const [leaders, setLeaders] = useState<{ id: number; name: string }[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingLeaders, setFetchingLeaders] = useState(true);

    React.useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const response = await apiClient.get<{ id: number; name: string }[]>('/auth/leaders');
                setLeaders(response.data);
                if (response.data.length > 0) {
                    setSelectedLeader(response.data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch leaders', error);
            } finally {
                setFetchingLeaders(false);
            }
        };
        fetchLeaders();
    }, []);

    const handleSubmit = async () => {
        if (!selectedLeader) {
            Alert.alert('Validation', 'Please select a leader.');
            return;
        }
        if (!startTime.trim() || !endTime.trim()) {
            Alert.alert('Validation', 'Enter start and end times as ISO 8601 (e.g. 2026-05-15T14:00:00).');
            return;
        }
        const startD = new Date(startTime);
        const endD = new Date(endTime);
        if (Number.isNaN(startD.getTime()) || Number.isNaN(endD.getTime())) {
            Alert.alert('Validation', 'Could not parse dates. Use a format like 2026-05-15T14:00:00.');
            return;
        }
        const startIso = startD.toISOString();
        const endIso = endD.toISOString();
        if (!reason.trim()) {
            Alert.alert('Validation', 'Please enter a reason for the appointment.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/appointments', {
                leader_id: selectedLeader,
                start_time: startIso,
                end_time: endIso,
                reason: reason.trim(),
            });
            Alert.alert('Submitted', 'Your appointment request was sent.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const msg =
                    error.response?.data?.error ??
                    error.response?.data?.message ??
                    error.message;
                Alert.alert('Request failed', String(msg));
            } else {
                Alert.alert('Request failed', 'Something went wrong.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Select Leader</Text>
                {fetchingLeaders ? (
                    <Text style={styles.loadingText}>Loading leaders...</Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaderRow}>
                        {leaders.map((leader) => (
                            <TouchableOpacity
                                key={leader.id}
                                style={[
                                    styles.leaderChip,
                                    selectedLeader === leader.id && styles.leaderChipActive,
                                ]}
                                onPress={() => setSelectedLeader(leader.id)}
                            >
                                <Text
                                    style={[
                                        styles.leaderChipText,
                                        selectedLeader === leader.id && styles.leaderChipTextActive,
                                    ]}
                                >
                                    {leader.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <Text style={styles.label}>Start (local / ISO)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="2026-05-15T14:00:00"
                    placeholderTextColor={Colors.textMuted}
                    value={startTime}
                    onChangeText={setStartTime}
                />

                <Text style={styles.label}>End</Text>
                <TextInput
                    style={styles.input}
                    placeholder="2026-05-15T15:00:00"
                    placeholderTextColor={Colors.textMuted}
                    value={endTime}
                    onChangeText={setEndTime}
                />

                <Text style={styles.label}>Reason</Text>
                <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder="Purpose of the meeting"
                    placeholderTextColor={Colors.textMuted}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Submitting…' : 'Submit request'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scroll: {
        padding: 24,
        paddingBottom: 48,
    },
    label: {
        color: Colors.textMuted,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: 12,
        padding: 14,
        color: Colors.text,
        fontSize: 16,
        marginBottom: 18,
    },
    multiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 17,
        fontWeight: '600',
    },
    loadingText: {
        color: Colors.textMuted,
        marginBottom: 18,
        fontSize: 14,
    },
    leaderRow: {
        flexDirection: 'row',
        marginBottom: 18,
    },
    leaderChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        marginRight: 10,
    },
    leaderChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    leaderChipText: {
        color: Colors.textMuted,
        fontWeight: '600',
    },
    leaderChipTextActive: {
        color: Colors.text,
    },
});

export default RequestAppointmentScreen;
