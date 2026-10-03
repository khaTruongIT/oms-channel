/**
 * useFormValidation Hook
 * Real-time form validation with Zod
 */

"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { validateForm } from "@/lib/validation";

export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: unknown) => {
      const result = validateForm(schema, data);
      if (!result.success) {
        setErrors(result.errors || {});
        return false;
      }
      setErrors({});
      return true;
    },
    [schema],
  );

  const validateField = useCallback(
    (fieldName: string, value: any, formData: any) => {
      const result = validateForm(schema, { ...formData, [fieldName]: value });
      if (!result.success && result.errors) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: result.errors![fieldName] || "",
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
      }
    },
    [schema],
  );

  const touchField = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (fieldName: string) => {
      return touched[fieldName] ? errors[fieldName] : undefined;
    },
    [errors, touched],
  );

  return {
    errors,
    touched,
    validate,
    validateField,
    touchField,
    resetValidation,
    getFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}
