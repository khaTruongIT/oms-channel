"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { triggerBatchSync } from "@/hooks/useJobs";
import {
  getCurrentTenant,
  updateTenant,
  useTenant,
  useTenants,
  setCurrentTenant,
  BusinessType,
  UpdateTenantInput,
  Tenant,
} from "@/hooks/useTenants";
import { useProfile, updateProfile } from "@/hooks/useProfile";
import { UserProfile } from "@/lib/auth";
import UsageDashboard from "@/components/settings/UsageDashboard";
import TeamManagement from "@/components/settings/TeamManagement";
import {
  User,
  Bell,
  Shield,
  RefreshCw,
  Save,
  Key,
  Mail,
  CheckCircle,
  AlertTriangle,
  Building2,
  MapPin,
  Palette,
  Globe,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

type TabKey =
  | "profile"
  | "business"
  | "team"
  | "subscription"
  | "security"
  | "notifications"
  | "sync";

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "business", label: "Business", icon: Building2 },
  { key: "team", label: "Team Members", icon: Users },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "sync", label: "Sync", icon: RefreshCw },
];

const businessTypes = [
  { value: BusinessType.RETAIL, label: "Retail" },
  { value: BusinessType.WHOLESALE, label: "Wholesale" },
  { value: BusinessType.DISTRIBUTOR, label: "Distributor" },
  { value: BusinessType.MANUFACTURER, label: "Manufacturer" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Ho_Chi_Minh",
  "Australia/Sydney",
];

const currencies = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "VND", label: "Vietnamese Dong (VND)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all user tenants
  const { tenants } = useTenants();
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  // Get current tenant from localStorage or auto-select first available
  useEffect(() => {
    const storedTenant = getCurrentTenant();
    if (storedTenant) {
      setCurrentTenantId(storedTenant.id);
    } else if (tenants.length > 0) {
      // Auto-select first tenant if none selected
      const firstTenant = tenants[0];
      setCurrentTenant(firstTenant);
      setCurrentTenantId(firstTenant.id);
    }
  }, [tenants]);

  const { tenant, mutate } = useTenant(currentTenantId);
  const { profile, mutate: mutateProfile } = useProfile();

  const [businessForm, setBusinessForm] = useState<UpdateTenantInput>({});
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        timezone: profile.timezone,
        avatarUrl: profile.avatarUrl,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (tenant) {
      setBusinessForm({
        shopName: tenant.shopName,
        businessName: tenant.businessName,
        businessType: tenant.businessType,
        taxId: tenant.taxId,
        registrationNumber: tenant.registrationNumber,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        website: tenant.website,
        addressLine1: tenant.addressLine1,
        addressLine2: tenant.addressLine2,
        city: tenant.city,
        state: tenant.state,
        postalCode: tenant.postalCode,
        country: tenant.country,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        timezone: tenant.timezone,
        currency: tenant.currency,
        locale: tenant.locale,
        dateFormat: tenant.dateFormat,
      });
    }
  }, [tenant]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const result = await triggerBatchSync();
      toast.success(result.message || "Sync started successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!tenant?.id) {
      toast.error(
        "No tenant available. Please create a tenant first or contact support.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateTenant(tenant.id, businessForm);
      await mutate();
      toast.success("Business settings saved successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save business settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(profileForm);
      await mutateProfile();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const updateBusinessForm = (field: keyof UpdateTenantInput, value: any) => {
    setBusinessForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateProfileForm = (field: keyof UserProfile, value: any) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-6 px-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-heading">Settings</h1>
            <p className="text-body mt-1">
              Manage your account and preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "business" && (
              <Button
                variant="primary"
                onClick={handleSaveBusiness}
                isLoading={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
            {activeTab === "profile" && (
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                isLoading={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-card p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "text-body hover:bg-secondary-100"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-heading mb-6">
                  Profile Information
                </h2>
                <div className="space-y-5">
                  <div className="flex items-center gap-4 mb-6">
                    {/* <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center overflow-hidden">
                      {profileForm.avatarUrl ? (
                        <img
                          src={profileForm.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {profileForm.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div> */}
                    <div className="space-y-2 flex-1">
                      <Input
                        placeholder="Avatar URL"
                        value={profileForm.avatarUrl || ""}
                        onChange={(e) =>
                          updateProfileForm("avatarUrl", e.target.value)
                        }
                        className="text-sm"
                      />
                      <p className="text-xs text-body">
                        Recommended size: 200x200px
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="First Name"
                      value={profileForm.firstName || ""}
                      onChange={(e) =>
                        updateProfileForm("firstName", e.target.value)
                      }
                      placeholder="First name"
                    />
                    <Input
                      label="Last Name"
                      value={profileForm.lastName || ""}
                      onChange={(e) =>
                        updateProfileForm("lastName", e.target.value)
                      }
                      placeholder="Last name"
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={profileForm.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={profileForm.phone || ""}
                    onChange={(e) => updateProfileForm("phone", e.target.value)}
                    placeholder="Phone number"
                  />
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">
                      Timezone
                    </label>
                    <select
                      value={profileForm.timezone || "UTC"}
                      onChange={(e) =>
                        updateProfileForm("timezone", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-4">
                    <Button
                      variant="primary"
                      onClick={handleSaveProfile}
                      isLoading={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "business" && (
              <div className="space-y-6">
                {/* Shop Information */}
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-heading mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Shop Information
                  </h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Shop Name"
                        value={businessForm.shopName || ""}
                        onChange={(e) =>
                          updateBusinessForm("shopName", e.target.value)
                        }
                        placeholder="My Awesome Shop"
                      />
                      <Input
                        label="Legal Business Name"
                        value={businessForm.businessName || ""}
                        onChange={(e) =>
                          updateBusinessForm("businessName", e.target.value)
                        }
                        placeholder="My Awesome Shop LLC"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-heading mb-2">
                          Business Type
                        </label>
                        <select
                          value={businessForm.businessType || ""}
                          onChange={(e) =>
                            updateBusinessForm(
                              "businessType",
                              e.target.value as BusinessType,
                            )
                          }
                          className="w-full px-4 py-2.5 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="">Select type</option>
                          {businessTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Tax ID / VAT Number"
                        value={businessForm.taxId || ""}
                        onChange={(e) =>
                          updateBusinessForm("taxId", e.target.value)
                        }
                        placeholder="TAX123456"
                      />
                    </div>
                    <Input
                      label="Registration Number"
                      value={businessForm.registrationNumber || ""}
                      onChange={(e) =>
                        updateBusinessForm("registrationNumber", e.target.value)
                      }
                      placeholder="BRN-2024-001"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-heading mb-6 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Business Email"
                        type="email"
                        value={businessForm.contactEmail || ""}
                        onChange={(e) =>
                          updateBusinessForm("contactEmail", e.target.value)
                        }
                        placeholder="contact@example.com"
                      />
                      <Input
                        label="Business Phone"
                        type="tel"
                        value={businessForm.contactPhone || ""}
                        onChange={(e) =>
                          updateBusinessForm("contactPhone", e.target.value)
                        }
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <Input
                      label="Website"
                      type="url"
                      value={businessForm.website || ""}
                      onChange={(e) =>
                        updateBusinessForm("website", e.target.value)
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-heading mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h2>
                  <div className="space-y-5">
                    <Input
                      label="Address Line 1"
                      value={businessForm.addressLine1 || ""}
                      onChange={(e) =>
                        updateBusinessForm("addressLine1", e.target.value)
                      }
                      placeholder="Street address"
                    />
                    <Input
                      label="Address Line 2"
                      value={businessForm.addressLine2 || ""}
                      onChange={(e) =>
                        updateBusinessForm("addressLine2", e.target.value)
                      }
                      placeholder="Apartment, suite, etc."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="City"
                        value={businessForm.city || ""}
                        onChange={(e) =>
                          updateBusinessForm("city", e.target.value)
                        }
                        placeholder="City"
                      />
                      <Input
                        label="State / Province"
                        value={businessForm.state || ""}
                        onChange={(e) =>
                          updateBusinessForm("state", e.target.value)
                        }
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Postal / Zip Code"
                        value={businessForm.postalCode || ""}
                        onChange={(e) =>
                          updateBusinessForm("postalCode", e.target.value)
                        }
                        placeholder="Postal code"
                      />
                      <Input
                        label="Country"
                        value={businessForm.country || ""}
                        onChange={(e) =>
                          updateBusinessForm("country", e.target.value)
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-heading mb-6 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Branding
                  </h2>
                  <div className="space-y-5">
                    <Input
                      label="Logo URL"
                      value={businessForm.logoUrl || ""}
                      onChange={(e) =>
                        updateBusinessForm("logoUrl", e.target.value)
                      }
                      placeholder="https://example.com/logo.png"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Primary Color"
                        type="color"
                        value={businessForm.primaryColor || "#000000"}
                        onChange={(e) =>
                          updateBusinessForm("primaryColor", e.target.value)
                        }
                        className="h-12 p-1"
                      />
                      <Input
                        label="Secondary Color"
                        type="color"
                        value={businessForm.secondaryColor || "#ffffff"}
                        onChange={(e) =>
                          updateBusinessForm("secondaryColor", e.target.value)
                        }
                        className="h-12 p-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Regional Settings */}
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-heading mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Regional Settings
                  </h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-heading mb-2">
                          Currency
                        </label>
                        <select
                          value={businessForm.currency || "USD"}
                          onChange={(e) =>
                            updateBusinessForm("currency", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          {currencies.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-heading mb-2">
                          Timezone
                        </label>
                        <select
                          value={businessForm.timezone || "UTC"}
                          onChange={(e) =>
                            updateBusinessForm("timezone", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-heading mb-6">
                  Security Settings
                </h2>
                <div className="space-y-6">
                  <div className="border-b border-secondary-200 pb-6">
                    <h3 className="font-medium text-heading mb-4 flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Change Password
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="••••••••"
                      />
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                      />
                      <Button variant="primary">Update Password</Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-heading mb-4">
                      Two-Factor Authentication
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-heading">
                            2FA is not enabled
                          </p>
                          <p className="text-sm text-body">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">
                        Enable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-heading mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: "New Orders",
                      description: "Get notified when new orders come in",
                      enabled: true,
                    },
                    {
                      label: "Low Stock Alerts",
                      description: "Alert when inventory drops below threshold",
                      enabled: true,
                    },
                    {
                      label: "Order Status Updates",
                      description: "Updates on order fulfillment status",
                      enabled: false,
                    },
                    {
                      label: "Weekly Reports",
                      description: "Weekly summary of sales and inventory",
                      enabled: true,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${item.enabled ? "bg-success/10" : "bg-secondary-100"} rounded-lg flex items-center justify-center`}
                        >
                          <Mail
                            className={`w-5 h-5 ${item.enabled ? "text-success" : "text-body"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-heading">
                            {item.label}
                          </p>
                          <p className="text-sm text-body">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={item.enabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="pt-6">
                  <Button variant="primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <TeamManagement tenant={tenant ?? null} />
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-heading mb-6">
                  Subscription & Usage
                </h2>
                <UsageDashboard tenant={tenant ?? null} />
              </div>
            )}

            {activeTab === "sync" && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-heading mb-6">
                  Sync & Integration
                </h2>
                <div className="space-y-6">
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-info rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-heading">
                            Stock Synchronization
                          </p>
                          <p className="text-sm text-body">
                            Sync inventory across all channels
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={handleTriggerSync}
                        isLoading={isSyncing}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        Trigger Sync
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-heading mb-4">
                      Connected Channels
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          name: "Shopify",
                          status: "connected",
                          lastSync: "2 hours ago",
                        },
                        {
                          name: "WooCommerce",
                          status: "connected",
                          lastSync: "1 hour ago",
                        },
                        {
                          name: "Lazada",
                          status: "pending",
                          lastSync: "Never",
                        },
                      ].map((channel, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                channel.status === "connected"
                                  ? "bg-success"
                                  : "bg-warning"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-heading">
                                {channel.name}
                              </p>
                              <p className="text-sm text-body">
                                Last sync: {channel.lastSync}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              channel.status === "connected"
                                ? "text-success"
                                : "text-warning"
                            }`}
                          >
                            {channel.status === "connected"
                              ? "Connected"
                              : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
