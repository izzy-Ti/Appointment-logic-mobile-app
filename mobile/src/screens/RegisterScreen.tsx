import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { UserRound, Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import apiClient from '../api/client';
import { alertAuthFailure } from '../api/alertAuthError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/types';
import type { User, UserRole } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const ROLES: { label: string; value: UserRole }[] = [
    { label: 'Requester', value: 'requester' },
    { label: 'Leadership', value: 'leadership' },
    { label: 'Secretary', value: 'secretary' },
];

const RegisterScreen = ({ navigation }: Props) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [role, setRole] = useState<UserRole>('requester');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Validation', 'Please enter your name.');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Validation', 'Please enter your email.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Validation', 'Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            Alert.alert('Validation', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post<{ token: string; user: User }>('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
                role,
                leadership_level: role === 'leadership' ? 1 : 0,
            });
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            const newRole = response.data.user.role;
            if (newRole === 'secretary') {
                navigation.replace('SecretaryDashboard');
            } else {
                navigation.replace('Dashboard');
            }
        } catch (error) {
            alertAuthFailure('Registration failed', error);
        } finally {
            setLoading(false);
        }
    };

    const form = (
        <>
            <TouchableOpacity
                style={styles.backRow}
                onPress={() => navigation.goBack()}
                disabled={loading}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <ArrowLeft color={Colors.text} size={22} />
                <Text style={styles.backText}>Back to sign in</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Join the appointment system</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                    <UserRound color={Colors.textMuted} size={20} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor={Colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Mail color={Colors.textMuted} size={20} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={Colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Lock color={Colors.textMuted} size={20} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={Colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                            <EyeOff color={Colors.textMuted} size={20} />
                        ) : (
                            <Eye color={Colors.textMuted} size={20} />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                    <Lock color={Colors.textMuted} size={20} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor={Colors.textMuted}
                        value={confirm}
                        onChangeText={setConfirm}
                        secureTextEntry={!showConfirm}
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? (
                            <EyeOff color={Colors.textMuted} size={20} />
                        ) : (
                            <Eye color={Colors.textMuted} size={20} />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.roleLabel}>I am a</Text>
                <View style={styles.roleRow}>
                    {ROLES.map((r) => (
                        <TouchableOpacity
                            key={r.value}
                            style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                            onPress={() => setRole(r.value)}
                            disabled={loading}
                        >
                            <Text
                                style={[
                                    styles.roleChipText,
                                    role === r.value && styles.roleChipTextActive,
                                ]}
                            >
                                {r.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Register'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    <Text style={styles.loginLinkText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView style={styles.flex} behavior="padding">
                    <ScrollView
                        style={styles.flex}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        {form}
                    </ScrollView>
                </KeyboardAvoidingView>
            ) : (
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    {form}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backText: {
        color: Colors.text,
        fontSize: 16,
        marginLeft: 4,
    },
    header: {
        marginBottom: 28,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textMuted,
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: Colors.surface,
        padding: 22,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        marginBottom: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: Colors.text,
        fontSize: 16,
    },
    roleLabel: {
        color: Colors.textMuted,
        fontSize: 14,
        marginBottom: 10,
        marginTop: 4,
    },
    roleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 18,
    },
    roleChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        backgroundColor: Colors.background,
        marginRight: 8,
        marginBottom: 8,
    },
    roleChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '33',
    },
    roleChipText: {
        color: Colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    roleChipTextActive: {
        color: Colors.text,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 17,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 8,
    },
    loginLinkText: {
        color: Colors.accent,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default RegisterScreen;
