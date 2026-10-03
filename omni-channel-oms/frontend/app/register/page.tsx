"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api-error";

const registerSchema = z
  .object({
    firstName: z.string("Name must be at least 2 characters"),
    lastName: z.string("Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-primary px-8 py-10 text-center">
            <h1 className="text-2xl font-bold text-black">Create Account</h1>
            <p className="text-black/80 text-sm mt-1">
              Join us to manage your orders
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="First Name"
                type="text"
                placeholder="John Doe"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last Name"
                type="text"
                placeholder="John Doe"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-body">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:text-primary-600 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
