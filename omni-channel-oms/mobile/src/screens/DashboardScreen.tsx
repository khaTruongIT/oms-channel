/**
 * Dashboard Screen
 * Main dashboard with role-based widgets
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchOrders } from "@store/slices/ordersSlice";
import { Card, Button } from "@components";
import { theme } from "@theme";
import { UserRole } from "@types";

export const DashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const dispatch = useAppDispatch();
  const { user, tenantRoles, selectedTenant } = useAppSelector(
    (state) => state.auth,
  );
  const { orders, isRefreshing } = useAppSelector((state) => state.orders);

  // Get user's role for selected tenant
  const userRole = tenantRoles.find(
    (tr) => tr.tenantId === selectedTenant?.id,
  )?.role;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    dispatch(fetchOrders({}));
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const processingOrders = orders.filter(
    (o) => o.status === "PROCESSING",
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.tenantName}>{selectedTenant?.name}</Text>
        <Text style={styles.role}>{userRole}</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{processingOrders}</Text>
          <Text style={styles.statLabel}>Processing</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{deliveredOrders}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Button
          title="View All Orders"
          onPress={() => navigation.navigate("Orders")}
          variant="primary"
          fullWidth
          style={styles.actionButton}
        />

        {(userRole === UserRole.OWNER ||
          userRole === UserRole.WAREHOUSE_MANAGER) && (
          <>
            <Button
              title="Manage Products"
              onPress={() => navigation.navigate("Products")}
              variant="secondary"
              fullWidth
              style={styles.actionButton}
            />

            <Button
              title="Manage Inventory"
              onPress={() => navigation.navigate("Inventory")}
              variant="outline"
              fullWidth
              style={styles.actionButton}
            />
          </>
        )}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {orders.slice(0, 5).map((order) => (
          <Card
            key={order.id}
            pressable
            onPress={() =>
              navigation.navigate("OrderDetails", { orderId: order.id })
            }
            style={styles.orderCard}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderChannel}>{order.channel}</Text>
            </View>
            <Text style={styles.orderCustomer}>{order.customerName}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderAmount}>
                ${order.totalAmount.toFixed(2)}
              </Text>
              <Text style={styles.orderStatus}>{order.status}</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.textStyles.h3,
    color: theme.colors.text,
  },
  tenantName: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  role: {
    ...theme.textStyles.caption,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: "48%",
    margin: theme.spacing.xs,
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  statValue: {
    ...theme.textStyles.h2,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.textStyles.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  orderCard: {
    marginBottom: theme.spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  orderNumber: {
    ...theme.textStyles.h6,
    color: theme.colors.text,
  },
  orderChannel: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
  orderCustomer: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderAmount: {
    ...theme.textStyles.h6,
    color: theme.colors.primary,
  },
  orderStatus: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
});
