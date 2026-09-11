// Single source of truth for enums/status strings shared across the app.
// Import from here instead of hardcoding strings in components or API routes.

export const USER_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
  DELETED: "DELETED",
} as const;

export const PROFILE_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;

export const PAYMENT_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NEEDS_INFO: "NEEDS_INFO",
} as const;

export const SUBSCRIPTION_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
} as const;

export const REPORT_STATUS = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

export const ROLES = {
  USER: "USER",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const MIN_AGE = 18;

export const THEMES = [
  { id: "rose-romance", name: "Rose Romance", swatch: ["#F43F5E", "#8B5CF6"] },
  { id: "cherry-love", name: "Cherry Love", swatch: ["#D6362A", "#C2410C"] },
  { id: "blush-dream", name: "Blush Dream", swatch: ["#EC5C8E", "#B794F6"] },
  { id: "midnight-love", name: "Midnight Love", swatch: ["#14111A", "#F43F5E"] },
  { id: "sunset-hearts", name: "Sunset Hearts", swatch: ["#FF6B35", "#EC4899"] },
  { id: "lavender-love", name: "Lavender Love", swatch: ["#8B5CF6", "#C026D3"] },
  { id: "sweet-candy", name: "Sweet Candy", swatch: ["#FF3D9A", "#38BDF8"] },
  { id: "royal-romance", name: "Royal Romance", swatch: ["#9333EA", "#D97706"] },
  { id: "emerald-romance", name: "Emerald Romance", swatch: ["#10B981", "#F43F5E"] },
  { id: "neon-love", name: "Neon Love", swatch: ["#0A0A12", "#FF0080"] },
] as const;

export const DEFAULT_THEME = "rose-romance";

// Notification types — extend here, reference by key everywhere else.
export const NOTIFICATION_TYPES = {
  NEW_LIKE: "NEW_LIKE",
  NEW_MATCH: "NEW_MATCH",
  NEW_MESSAGE: "NEW_MESSAGE",
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTION_ACCEPTED: "CONNECTION_ACCEPTED",
  NEW_FOLLOWER: "NEW_FOLLOWER",
  POST_LIKE: "POST_LIKE",
  COMMENT: "COMMENT",
  PROFILE_APPROVED: "PROFILE_APPROVED",
  PROFILE_REJECTED: "PROFILE_REJECTED",
  PAYMENT_SUBMITTED: "PAYMENT_SUBMITTED",
  PAYMENT_APPROVED: "PAYMENT_APPROVED",
  PAYMENT_REJECTED: "PAYMENT_REJECTED",
  MEMBERSHIP_EXPIRING: "MEMBERSHIP_EXPIRING",
  MEMBERSHIP_ACTIVATED: "MEMBERSHIP_ACTIVATED",
  WHATSAPP_REQUEST: "WHATSAPP_REQUEST",
  WHATSAPP_ACCEPTED: "WHATSAPP_ACCEPTED",
  ADMIN_ANNOUNCEMENT: "ADMIN_ANNOUNCEMENT",
} as const;
