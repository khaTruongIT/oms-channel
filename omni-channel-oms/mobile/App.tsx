/**
 * App Entry Point
 * Main application component with Redux Provider
 */

import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store } from "./src/store";
import { RootNavigator } from "./src/navigation/RootNavigator";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
