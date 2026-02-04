/**
 * Orders List Screen
 * Display all orders with filters
 */

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchOrders,
  refreshOrders,
  setFilters,
} from "@store/slices/ordersSlice";
import { Card, EmptyState, Badge, Input } from "@components";
import { theme } from "@theme";
import { Order, Channel, OrderStatus } from "@types";

export const OrdersListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const dispatch = useAppDispatch();
  const { orders, isLoading, isRefreshing, filters } = useAppSelector(
    (state) => state.orders,
  );

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchOrders(filters));
  }, [filters]);

  const handleRefresh = () => {
    dispatch(refreshOrders(filters));
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderDetails", { orderId: order.id });
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    dispatch(setFilters({ ...filters, search: text }));
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card
      pressable
      onPress={() => handleOrderPress(item)}
      style={styles.orderCard}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Badge status={item.status} label={item.status} />
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderCustomer}>{item.customerName}</Text>
        <Text style={styles.orderChannel}>{item.channel}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderAmount}>${item.totalAmount.toFixed(2)}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={handleSearch}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Orders Found"
            description="There are no orders to display"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  orderCard: {
    marginBottom: theme.spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  orderNumber: {
    ...theme.textStyles.h6,
    color: theme.colors.text,
  },
  orderInfo: {
    marginBottom: theme.spacing.sm,
  },
  orderCustomer: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  orderChannel: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderAmount: {
    ...theme.textStyles.h6,
    color: theme.colors.primary,
  },
  orderDate: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
});
