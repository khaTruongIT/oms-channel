/**
 * Orders List Screen
 * Display all orders with filters and infinite scroll pagination (S2.1.10)
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchOrders,
  fetchMoreOrders,
  refreshOrders,
  setFilters,
} from "@store/slices/ordersSlice";
import { Card, EmptyState, Badge, Input } from "@components";
import { theme } from "@theme";
import { Order } from "@types";

export const OrdersListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const dispatch = useAppDispatch();
  const { orders, isLoading, isLoadingMore, isRefreshing, filters, meta } =
    useAppSelector((state) => state.orders);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchOrders(filters));
  }, [filters]);

  const handleRefresh = () => {
    dispatch(refreshOrders(filters));
  };

  const handleLoadMore = () => {
    if (meta?.hasNextPage && !isLoadingMore && !isLoading) {
      dispatch(fetchMoreOrders());
    }
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <EmptyState
              title="No Orders Found"
              description="There are no orders to display"
            />
          )
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
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
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
