/**
 * Order Status Validation Utilities
 * Validates order status transitions
 */

import { OrderStatus } from "@types";

// Valid status transitions map
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [], // Final state
  [OrderStatus.CANCELLED]: [], // Final state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];
  return validNextStatuses.includes(newStatus);
}

/**
 * Get valid next statuses for current status
 */
export function getValidNextStatuses(
  currentStatus: OrderStatus,
): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}

/**
 * Get error message for invalid transition
 */
export function getInvalidTransitionMessage(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): string {
  const validStatuses = getValidNextStatuses(currentStatus);

  if (validStatuses.length === 0) {
    return `Cannot change status from ${currentStatus}. This is a final state.`;
  }

  return `Cannot change status from ${currentStatus} to ${newStatus}. Valid transitions: ${validStatuses.join(
    ", ",
  )}`;
}
