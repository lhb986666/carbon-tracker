import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import CardNotificationTask from './src/tasks/CardNotificationTask';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Headless JS Task 등록
AppRegistry.registerHeadlessTask('CardNotificationTask', () => CardNotificationTask);