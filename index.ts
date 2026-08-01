import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './App';

// enableScreens solo en plataformas nativas, no en web
if (Platform.OS !== 'web') {
  enableScreens();
}

registerRootComponent(App);
