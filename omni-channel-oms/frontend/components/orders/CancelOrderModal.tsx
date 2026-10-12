"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  orderNumber?: string;
  isSubmitting?: boolean;
}

const PRESET_REASONS = [
  "Customer requested cancellation",
  "Out of stock / Inventory shortage",
  "Incorrect pricing or promotion error",
  "Payment issue or fraud risk",
  "Duplicate order",
];

export default function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  isSubmitting = false,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = reason.trim().length > 0;

  const handleClose = () => {
    if (isSubmitting) return;
    setReason("");
    setTouched(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    await onConfirm(reason.trim());
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Cancel Order ${orderNumber ? `#${orderNumber}` : ""}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium">Cancellation is irreversible</p>
            <p className="text-amber-700">
              Reserved inventory will be released back to stock. A valid reason is
              required for auditing and channel synchronization.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-1.5">
            Quick Reasons:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  setTouched(true);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  reason === preset
                    ? "border-primary bg-primary-50 text-primary font-medium"
                    : "border-border bg-white text-body hover:bg-secondary-50"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="cancel-reason"
            className="block text-sm font-medium text-heading mb-1"
          >
            Cancellation Reason <span className="text-danger">*</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setTouched(true);
            }}
            placeholder="Explain why this order is being cancelled..."
            className={`w-full rounded-lg border px-3 py-2 text-sm text-heading placeholder-placeholder focus:outline-none focus:ring-2 ${
              touched && !isValid
                ? "border-danger focus:ring-danger/20"
                : "border-border focus:border-primary focus:ring-primary/20"
            }`}
          />
          {touched && !isValid && (
            <p className="mt-1 text-xs text-danger">
              Please provide a non-empty cancellation reason.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Keep Order
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
