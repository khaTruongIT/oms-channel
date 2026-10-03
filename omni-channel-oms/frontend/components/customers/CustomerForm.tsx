/**
 * CustomerForm Component
 * Create/Edit customer modal with validation
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button";
import { useFormValidation } from "@/hooks/useFormValidation";
import { customerSchema, CustomerFormData } from "@/lib/validation";
import { Customer } from "@/hooks/useCustomers";

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onClose: () => void;
}

export default function CustomerForm({
  customer,
  onSubmit,
  onClose,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { errors, validate, validateField, touchField, getFieldError } =
    useFormValidation(customerSchema);

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value, formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? "Edit Customer" : "New Customer"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => touchField("name")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                getFieldError("name")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary-500"
              }`}
              placeholder="John Doe"
            />
            {getFieldError("name") && (
              <p className="mt-1 text-sm text-red-500">
                {getFieldError("name")}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => touchField("email")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                getFieldError("email")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary-500"
              }`}
              placeholder="john@example.com"
            />
            {getFieldError("email") && (
              <p className="mt-1 text-sm text-red-500">
                {getFieldError("email")}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : customer ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
