/**
 * Order Details Screen
 * Display detailed information about an order
 */

import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchOrderById, updateOrderStatus } from "@store/slices/ordersSlice";
import { Card, Badge, Button, LoadingSpinner } from "@components";
import { theme } from "@theme";
import { UserRole, OrderStatus } from "@types";

interface OrderDetailsScreenProps {
  navigation: any;
  route: { params: { orderId: string } };
}

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const { selectedOrder, isLoading } = useAppSelector((state) => state.orders);
  const { tenantRoles, selectedTenant } = useAppSelector((state) => state.auth);

  // Get user's role
  const userRole = tenantRoles.find(
    (tr) => tr.tenantId === selectedTenant?.id,
  )?.role;

  const canUpdateStatus =
    userRole === UserRole.OWNER || userRole === UserRole.WAREHOUSE_MANAGER;

  useEffect(() => {
    dispatch(fetchOrderById(orderId));
  }, [orderId]);

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    Alert.alert("Update Order Status", `Change status to ${newStatus}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await dispatch(
              updateOrderStatus({ id: orderId, data: { status: newStatus } }),
            ).unwrap();
            Alert.alert("Success", "Order status updated");
          } catch (error) {
            Alert.alert("Error", "Failed to update order status");
          }
        },
      },
    ]);
  };

  if (isLoading || !selectedOrder) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.orderNumber}>{selectedOrder.orderNumber}</Text>
          <Badge status={selectedOrder.status} label={selectedOrder.status} />
        </View>
        <Text style={styles.channel}>{selectedOrder.channel}</Text>
      </Card>

      {/* Customer Information */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{selectedOrder.customerName}</Text>
        </View>
        {selectedOrder.customerEmail && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{selectedOrder.customerEmail}</Text>
          </View>
        )}
        {selectedOrder.customerPhone && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{selectedOrder.customerPhone}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{selectedOrder.shippingAddress}</Text>
        </View>
      </Card>

      {/* Order Items */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {selectedOrder.items?.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.variantName && (
                <Text style={styles.itemVariant}>{item.variantName}</Text>
              )}
            </View>
            <View style={styles.itemPricing}>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                ${item.totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>
            ${selectedOrder.totalAmount.toFixed(2)}
          </Text>
        </View>
      </Card>

      {/* Status Update Actions */}
      {canUpdateStatus && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          {selectedOrder.status === OrderStatus.PENDING && (
            <Button
              title="Mark as Processing"
              onPress={() => handleUpdateStatus(OrderStatus.PROCESSING)}
              variant="primary"
              fullWidth
              style={styles.actionButton}
            />
          )}
          {selectedOrder.status === OrderStatus.PROCESSING && (
            <Button
              title="Mark as Shipped"
              onPress={() => handleUpdateStatus(OrderStatus.SHIPPED)}
              variant="primary"
              fullWidth
              style={styles.actionButton}
            />
          )}
          {selectedOrder.status === OrderStatus.SHIPPED && (
            <Button
              title="Mark as Delivered"
              onPress={() => handleUpdateStatus(OrderStatus.DELIVERED)}
              variant="primary"
              fullWidth
              style={styles.actionButton}
            />
          )}
          {selectedOrder.status !== OrderStatus.CANCELLED && (
            <Button
              title="Cancel Order"
              onPress={() => handleUpdateStatus(OrderStatus.CANCELLED)}
              variant="outline"
              fullWidth
              style={styles.actionButton}
            />
          )}
        </Card>
      )}
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
  headerCard: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  orderNumber: {
    ...theme.textStyles.h4,
    color: theme.colors.text,
  },
  channel: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.textStyles.h5,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
  },
  label: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
    width: 80,
  },
  value: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...theme.textStyles.body,
    color: theme.colors.text,
  },
  itemVariant: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
  itemPricing: {
    alignItems: "flex-end",
  },
  itemQuantity: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
  itemPrice: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    ...theme.textStyles.h5,
    color: theme.colors.text,
  },
  totalAmount: {
    ...theme.textStyles.h4,
    color: theme.colors.primary,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
});
