/**
 * Warehouse Details Page
 * Comprehensive warehouse view with map, inventory, and stats
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

// Mock warehouse data - TODO: Replace with API
interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number;
  lng: number;
  capacity: number;
  currentStock: number;
  staff: number;
}

export default function WarehouseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  // Mock data - TODO: Fetch from API
  const warehouse: Warehouse = {
    id: warehouseId,
    name: "Main Warehouse",
    address: "123 Storage Lane",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    country: "USA",
    lat: 34.0522,
    lng: -118.2437,
    capacity: 10000,
    currentStock: 7500,
    staff: 25,
  };

  const utilizationPercent =
    (warehouse.currentStock / warehouse.capacity) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push("/warehouses")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-heading">
                {warehouse.name}
              </h1>
              <p className="text-body mt-1">Warehouse Details</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/warehouses/${warehouseId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Warehouse
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Capacity</div>
                <div className="text-2xl font-bold text-gray-900">
                  {warehouse.capacity.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {utilizationPercent.toFixed(1)}% utilized
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Current Stock</div>
                <div className="text-2xl font-bold text-gray-900">
                  {warehouse.currentStock.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  {warehouse.capacity - warehouse.currentStock} available
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Staff</div>
                <div className="text-2xl font-bold text-gray-900">
                  {warehouse.staff}
                </div>
                <div className="text-sm text-gray-500 mt-1">employees</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Info */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Location
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {warehouse.address}
                  </div>
                  <div className="text-gray-600">
                    {warehouse.city}, {warehouse.state} {warehouse.zipCode}
                  </div>
                  <div className="text-gray-600">{warehouse.country}</div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-4 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Map integration coming soon</p>
                <p className="text-xs text-gray-400 mt-1">
                  Lat: {warehouse.lat}, Lng: {warehouse.lng}
                </p>
              </div>
            </div>
          </div>

          {/* Capacity Utilization */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Capacity Utilization
            </h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Usage</span>
                <span className="text-sm font-semibold text-gray-900">
                  {utilizationPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    utilizationPercent > 90
                      ? "bg-red-500"
                      : utilizationPercent > 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Used</div>
                <div className="text-xl font-bold text-gray-900">
                  {warehouse.currentStock.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Available</div>
                <div className="text-xl font-bold text-green-600">
                  {(
                    warehouse.capacity - warehouse.currentStock
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory
          </h2>
          <div className="text-center py-8 text-gray-500">
            Inventory details coming soon
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
