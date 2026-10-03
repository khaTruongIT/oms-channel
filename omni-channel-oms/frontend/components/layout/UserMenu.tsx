"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User as UserIcon, ChevronDown } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { authService } from "@/lib/auth";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { profile } = useProfile();
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials()
          )}
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : profile?.email || "User"}
          </div>
          <div className="text-xs text-gray-500">
            {profile?.email || "user@example.com"}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-menu border border-gray-200 py-2 z-50">
          {/* User Info (mobile only) */}
          <div className="md:hidden px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile?.email || "User"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {profile?.email || "user@example.com"}
            </div>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/settings#profile");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-secondary-50 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </button>

          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-secondary-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <div className="border-t border-gray-100 my-2" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
