CREATE TYPE "LeadSource" AS ENUM ('HOME', 'PRODUCT_DETAIL', 'CLINIC_LOCATOR');

CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'BOOKED', 'CLOSED', 'SPAM');

CREATE TABLE "ConsultationLead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "province" TEXT,
    "district" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "clinicId" TEXT,
    "preferredTime" TEXT,
    "note" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'HOME',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsultationLead_status_createdAt_idx" ON "ConsultationLead"("status", "createdAt");
CREATE INDEX "ConsultationLead_phone_idx" ON "ConsultationLead"("phone");
CREATE INDEX "ConsultationLead_productId_idx" ON "ConsultationLead"("productId");
CREATE INDEX "ConsultationLead_clinicId_idx" ON "ConsultationLead"("clinicId");
