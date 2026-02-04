/**
 * Main Navigator
 * Bottom tab navigator for main app screens
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { DashboardScreen } from "@screens/DashboardScreen";
import { OrdersListScreen } from "@screens/orders/OrdersListScreen";
import { OrderDetailsScreen } from "@screens/orders/OrderDetailsScreen";
import { theme } from "@theme";

export type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Products: undefined;
  Inventory: undefined;
  Profile: undefined;
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetails: { orderId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const OrdersStack = createStackNavigator<OrdersStackParamList>();

// Orders Stack Navigator
const OrdersNavigator: React.FC = () => {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersListScreen}
        options={{ title: "Orders" }}
      />
      <OrdersStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
    </OrdersStack.Navigator>
  );
};

// Placeholder screens for Products, Inventory, Profile
const ProductsScreen = () => null;
const InventoryScreen = () => null;
const ProfileScreen = () => null;

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          height: theme.dimensions.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.textInverse,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{
          title: "Orders",
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: "Products",
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: "Inventory",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};
