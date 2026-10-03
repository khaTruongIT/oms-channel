export const articleStatuses = [
  "DRAFT",
  "PENDING_MEDICAL_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
] as const;

export type ArticleStatus = (typeof articleStatuses)[number];

export interface Product {
  id: string;
  slug: string;
  name: string;
  line: string;
  summary: string;
  needs: string[];
  indexes: string[];
  coatings: string[];
  technologies: string[];
  heroImage: string;
  specsJson: ProductSpecs;
  isFeatured: boolean;
}

export interface ProductSpecs {
  abbe: string;
  uvProtection: string;
  recommendedFor: string[];
  wavelength: {
    adverse: string;
    beneficial: string;
    claim: string;
  };
}

export interface MedicalExpert {
  id: string;
  name: string;
  title: string;
  credential: string;
  bio: string;
}

export interface ArticleBlock {
  id: string;
  type: "heading" | "paragraph" | "callout" | "reference";
  text: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentJson: ArticleBlock[];
  category: string;
  tags: string[];
  status: ArticleStatus;
  seoTitle: string;
  seoDescription: string;
  seoScore: number;
  authorId: string;
  reviewerId: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  author?: MedicalExpert;
  reviewer?: MedicalExpert;
  relatedProducts?: Product[];
}

export interface Clinic {
  id: string;
  name: string;
  province: string;
  district: string;
  address: string;
  hotline: string;
  hours: string;
  lat: number;
  lng: number;
  services: string[];
}

export const leadSources = ["HOME", "PRODUCT_DETAIL", "CLINIC_LOCATOR"] as const;
export type LeadSource = (typeof leadSources)[number];

export const leadStatuses = ["NEW", "CONTACTED", "BOOKED", "CLOSED", "SPAM"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export interface ConsultationLead {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  province: string | null;
  district: string | null;
  productId: string | null;
  productName: string | null;
  clinicId: string | null;
  preferredTime: string | null;
  note: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SeoInput {
  title: string;
  seoTitle: string;
  seoDescription: string;
  slug?: string;
  category?: string;
  relatedProductIds?: string[];
}

export interface SeoCheck {
  label: string;
  passed: boolean;
}

export interface SeoResult {
  score: number;
  warnings: string[];
  checks: SeoCheck[];
}

export const userRoles = ["ADMIN", "EDITOR", "MEDICAL_REVIEWER"] as const;
export type UserRole = (typeof userRoles)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title?: string | null;
  degree?: string | null;
  experience?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AuthLoginDto {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
