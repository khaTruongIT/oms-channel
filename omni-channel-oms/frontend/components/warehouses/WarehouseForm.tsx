"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Warehouse, updateWarehouse } from "@/hooks/useWarehouses";

const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  location: z.string().optional(),
  address: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WarehouseFormData) => void;
  warehouse?: Warehouse;
}

export default function WarehouseForm({
  isOpen,
  onClose,
  onSubmit,
  warehouse,
}: WarehouseFormProps) {
  const isEditing = !!warehouse;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouse || {
      name: "",
      location: "",
      address: "",
      isDefault: false,
    },
  });

  const handleFormSubmit = async (data: WarehouseFormData) => {
    if (isEditing && warehouse) {
      await updateWarehouse(warehouse.id, data);
    } else {
      await onSubmit(data);
    }
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Warehouse" : "Add Warehouse"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Input
          label="Warehouse Name"
          placeholder="Main Warehouse"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Location"
          placeholder="Ho Chi Minh City"
          error={errors.location?.message}
          {...register("location")}
        />

        <Input
          label="Address"
          placeholder="123 Street, District 1"
          error={errors.address?.message}
          {...register("address")}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isDefault"
            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            {...register("isDefault")}
          />
          <label htmlFor="isDefault" className="text-sm text-heading">
            Set as default warehouse
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? "Save Changes" : "Create Warehouse"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
