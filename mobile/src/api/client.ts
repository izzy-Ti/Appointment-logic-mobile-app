import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveApiBaseUrl(): string {
    const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (fromEnv) {
        return fromEnv.endsWith('/api') ? fromEnv : `${fromEnv.replace(/\/$/, '')}/api`;
    }

    const hostUri = Constants.expoConfig?.hostUri;
    const lanHost = hostUri?.split(':')[0];
    if (lanHost && lanHost !== '127.0.0.1' && lanHost !== 'localhost') {
        return `http://${lanHost}:5000/api`;
    }

    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5000/api';
    }

    return 'http://127.0.0.1:5000/api';
}

const resolvedBaseUrl = resolveApiBaseUrl();
if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log('[api] base URL:', resolvedBaseUrl);
}

const apiClient = axios.create({
    baseURL: resolvedBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
