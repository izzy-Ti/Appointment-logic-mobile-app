import { Alert } from 'react-native';
import axios from 'axios';
import apiClient from './client';

export function alertAuthFailure(title: string, error: unknown) {
    const base = apiClient.defaults.baseURL ?? '(unknown)';

    if (axios.isAxiosError(error) && !error.response) {
        Alert.alert(
            title,
            `No response from the API.\n\nUsing:\n${base}\n\n` +
                '• Confirm the backend is running (port 5000).\n' +
                '• On a physical device, set EXPO_PUBLIC_API_URL in mobile/.env to http://YOUR_PC_IP:5000/api (see ipconfig), then restart Expo with cache clear.\n' +
                '• Allow Node.js through Windows Firewall on port 5000.'
        );
        return;
    }

    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string; error?: string } | undefined;
        const msg = data?.message ?? data?.error ?? error.message;
        Alert.alert(title, String(msg));
        return;
    }

    Alert.alert(title, `Something went wrong: ${error instanceof Error ? error.message : String(error)}`);
}
