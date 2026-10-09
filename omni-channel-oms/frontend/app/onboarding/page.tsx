"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, CircleAlert, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  BusinessType,
  completeOnboarding,
  createTenant,
  setCurrentTenant,
  type Tenant,
} from "@/hooks/useTenants";
import { getApiErrorMessage } from "@/lib/api-error";
import { buildTenantOnboardingInput } from "@/lib/onboarding";

const onboardingSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(3, "Store name must have at least 3 characters."),
  businessName: z.string().trim().max(255).optional(),
  contactEmail: z.union([
    z.string().trim().email("Enter a valid email."),
    z.literal(""),
  ]),
  businessType: z.union([z.nativeEnum(BusinessType), z.literal("")]),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  locale: z.string().min(2),
  dateFormat: z.string().min(1),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const businessTypeOptions = [
  { value: BusinessType.RETAIL, label: "Retail" },
  { value: BusinessType.WHOLESALE, label: "Wholesale" },
  { value: BusinessType.DISTRIBUTOR, label: "Distributor" },
  { value: BusinessType.MANUFACTURER, label: "Manufacturer" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      shopName: "",
      businessName: "",
      contactEmail: "",
      businessType: "",
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
      locale: "vi-VN",
      dateFormat: "DD/MM/YYYY",
    },
  });

  const completeTenantOnboarding = async (tenant: Tenant): Promise<void> => {
    setIsCompleting(true);
    try {
      const activatedTenant = await completeOnboarding(tenant.id);
      setCurrentTenant(activatedTenant);
      toast.success("Store is ready for your first order.");
      router.replace("/");
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Store was created but setup could not be completed.",
        ),
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const onSubmit = async (values: OnboardingFormValues): Promise<void> => {
    try {
      const tenant = await createTenant(buildTenantOnboardingInput(values));
      setCurrentTenant(tenant);
      setCreatedTenant(tenant);
      await completeTenantOnboarding(tenant);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to create your store. Please try again.",
        ),
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/40 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute -right-16 top-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <Link
              href="/tenants"
              className="inline-flex w-fit items-center gap-2 text-sm text-indigo-100 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              My stores
            </Link>

            <div className="mt-14">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <Store className="h-6 w-6" />
              </div>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Workspace setup
              </p>
              <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-tight">
                Create the operating home for your next store.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-indigo-100">
                We will provision an isolated workspace, assign you as owner,
                and prepare it for products, inventory, and sales channels.
              </p>
            </div>

            <ol className="mt-12 space-y-4 text-sm text-indigo-100">
              {["Store profile", "Isolated workspace", "Ready to operate"].map(
                (step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200/60 text-xs font-semibold">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </div>
        </section>

        <section className="bg-white p-6 text-slate-900 sm:p-10 lg:p-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-indigo-600">New store</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Tell us about the workspace
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You can refine business details, members, and integrations from
              Settings after setup.
            </p>

            {createdTenant ? (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <h3 className="font-semibold text-amber-950">
                      Store created, setup still pending
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-amber-900">
                      Your workspace exists. Finish activation before continuing
                      to the dashboard.
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() =>
                        void completeTenantOnboarding(createdTenant)
                      }
                      isLoading={isCompleting}
                    >
                      Finish setup
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="mt-8 space-y-5"
                onSubmit={handleSubmit(onSubmit)}
              >
                <Input
                  label="Store name"
                  placeholder="North Star Shop"
                  autoComplete="organization"
                  error={errors.shopName?.message}
                  {...register("shopName")}
                />
                <Input
                  label="Legal business name"
                  placeholder="North Star Trading Co."
                  autoComplete="organization"
                  error={errors.businessName?.message}
                  {...register("businessName")}
                />
                <Input
                  label="Business email"
                  type="email"
                  placeholder="ops@example.com"
                  autoComplete="email"
                  error={errors.contactEmail?.message}
                  {...register("contactEmail")}
                />

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-heading"
                    htmlFor="businessType"
                  >
                    Business type
                  </label>
                  <select
                    id="businessType"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-heading outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    {...register("businessType")}
                  >
                    <option value="">Choose later</option>
                    {businessTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-heading"
                      htmlFor="timezone"
                    >
                      Time zone
                    </label>
                    <select
                      id="timezone"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-heading outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      {...register("timezone")}
                    >
                      <option value="Asia/Ho_Chi_Minh">
                        Ho Chi Minh City (GMT+7)
                      </option>
                      <option value="Asia/Singapore">Singapore (GMT+8)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-heading"
                      htmlFor="currency"
                    >
                      Currency
                    </label>
                    <select
                      id="currency"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-heading outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      {...register("currency")}
                    >
                      <option value="VND">Vietnamese Dong (VND)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="SGD">Singapore Dollar (SGD)</option>
                    </select>
                  </div>
                </div>

                <input type="hidden" {...register("locale")} />
                <input type="hidden" {...register("dateFormat")} />

                <Button
                  type="submit"
                  className="mt-2 w-full"
                  size="lg"
                  isLoading={isSubmitting || isCompleting}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create and activate store
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
