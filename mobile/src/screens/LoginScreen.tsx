import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { LogIn, Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import apiClient from '../api/client';
import { alertAuthFailure } from '../api/alertAuthError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/types';
import type { User } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post<{ token: string; user: User }>('/auth/login', {
                email,
                password,
            });
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            const role = response.data.user.role;
            if (role === 'secretary') {
                navigation.replace('SecretaryDashboard');
            } else {
                navigation.replace('Dashboard');
            }
        } catch (error) {
            alertAuthFailure('Login failed', error);
        } finally {
            setLoading(false);
        }
    };

    const form = (
        <>
            <View style={styles.header}>
                <Text style={styles.title}>University Leadership</Text>
                <Text style={styles.subtitle}>Appointment Management System</Text>
            </View>

            <View style={styles.formContainer}>
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

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Sign In'}</Text>
                    <LogIn color={Colors.text} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => navigation.navigate('Register')}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    <Text style={styles.registerLinkText}>Create an account</Text>
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
        justifyContent: 'center',
        padding: 24,
        paddingVertical: 40,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        marginBottom: 16,
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
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 8,
    },
    registerLinkText: {
        color: Colors.accent,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen;
