// Avoid importing the package root (Metro can fail on ./components/touchables on Windows).
import { initialize } from 'react-native-gesture-handler/lib/module/init';
initialize();
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
