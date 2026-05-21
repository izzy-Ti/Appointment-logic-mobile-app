import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { User as UserIcon, Mail, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';
import type { RootStackParamList } from '../navigation/types';
import type { User } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: Props) => {
    const [user, setUser] = useState<User | null>(null);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const raw = await AsyncStorage.getItem('user');
                if (raw) {
                    setUser(JSON.parse(raw) as User);
                }
            })();
        }, [])
    );

    const handleLogout = () => {
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

    if (!user) return <View style={styles.container} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.role}>{user.role.toUpperCase()}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.iconWrapper}>
                                <UserIcon color={Colors.textMuted} size={20} />
                            </View>
                            <View style={styles.rowData}>
                                <Text style={styles.rowLabel}>Full Name</Text>
                                <Text style={styles.rowValue}>{user.name}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <View style={styles.iconWrapper}>
                                <Mail color={Colors.textMuted} size={20} />
                            </View>
                            <View style={styles.rowData}>
                                <Text style={styles.rowLabel}>Email</Text>
                                <Text style={styles.rowValue}>{user.email}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <View style={styles.iconWrapper}>
                                <ShieldCheck color={Colors.textMuted} size={20} />
                            </View>
                            <View style={styles.rowData}>
                                <Text style={styles.rowLabel}>Access Level</Text>
                                <Text style={styles.rowValue}>{user.role}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut color={Colors.error} size={20} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
        padding: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
        letterSpacing: 1,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    rowData: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    rowValue: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.glassBorder,
        marginVertical: 8,
        marginLeft: 56,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.error + '15',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.error + '40',
    },
    logoutText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ProfileScreen;
