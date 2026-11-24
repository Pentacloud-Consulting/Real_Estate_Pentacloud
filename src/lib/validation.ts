import { z } from "zod";

// Login
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Lead
export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().min(5, "Mobile number is required"),
  whatsapp: z.string().optional(),
  nationality: z.string().optional(),
  countryOfResidence: z.string().optional(),
  preferredLanguage: z.string().optional(),
  buyerType: z.string().optional(),
  projectId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  interestedProject: z.string().optional(),
  propertyType: z.string().optional(),
  bedroomCount: z.string().optional(),
  preferredFloor: z.string().optional(),
  preferredView: z.string().optional(),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  purchasePurpose: z.string().optional(),
  preferredPaymentPlan: z.string().optional(),
  expectedTimeline: z.string().optional(),
  source: z.string().default("WEBSITE"),
  brokerId: z.string().optional().nullable(),
  campaignName: z.string().optional(),
  campaignId: z.string().optional(),
  temperature: z.string().default("WARM"),
  assignedAdvisorId: z.string().optional().nullable(),
  salesManagerId: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  qualificationNotes: z.string().optional(),
});

// Buyer Account
export const buyerAccountSchema = z.object({
  buyerType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  nationality: z.string().optional(),
  countryOfResidence: z.string().optional(),
  preferredLanguage: z.string().optional(),
  passportNumber: z.string().optional(),
  nationalId: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  companyName: z.string().optional(),
  tradeLicenseNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxRegistration: z.string().optional(),
  registeredAddress: z.string().optional(),
  companyContact: z.string().optional(),
  authorizedSignatory: z.string().optional(),
  relationshipManagerId: z.string().optional().nullable(),
});

// Opportunity
export const opportunitySchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  buyerId: z.string().min(1, "Buyer is required"),
  projectId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  propertyType: z.string().optional(),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  budget: z.coerce.number().min(0).optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional(),
  expectedClosingDate: z.string().optional().nullable(),
  stage: z.string().default("NEW"),
  notes: z.string().optional(),
  assignedAdvisorId: z.string().optional().nullable(),
  salesManagerId: z.string().optional().nullable(),
});

// Project
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  code: z.string().min(1, "Project code is required"),
  developer: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  status: z.string().default("ACTIVE"),
  launchDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  totalUnits: z.coerce.number().int().min(0).optional(),
  propertyType: z.string().optional(),
  priceRangeMin: z.coerce.number().min(0).optional().nullable(),
  priceRangeMax: z.coerce.number().min(0).optional().nullable(),
  amenities: z.string().optional(),
});

// Unit
export const unitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  projectId: z.string().min(1, "Project is required"),
  buildingId: z.string().optional().nullable(),
  floor: z.coerce.number().int().optional().nullable(),
  unitType: z.string().min(1, "Unit type is required"),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  area: z.coerce.number().min(0).optional().nullable(),
  areaUnit: z.string().default("SQFT"),
  view: z.string().optional(),
  facing: z.string().optional(),
  basePrice: z.coerce.number().min(0).default(0),
  floorPremium: z.coerce.number().min(0).default(0),
  viewPremium: z.coerce.number().min(0).default(0),
  additionalCharges: z.coerce.number().min(0).default(0),
  finalPrice: z.coerce.number().min(0).default(0),
  status: z.string().default("AVAILABLE"),
});

// EOI
export const eoiSchema = z.object({
  buyerId: z.string().min(1, "Buyer is required"),
  opportunityId: z.string().optional().nullable(),
  projectId: z.string().min(1, "Project is required"),
  unitId: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().min(0, "Unit price is required"),
  tokenAmount: z.coerce.number().min(0, "Token amount is required"),
  isRefundable: z.boolean().default(false),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  preferredPaymentPlan: z.string().optional(),
  notes: z.string().optional(),
});

// Quotation
export const quotationSchema = z.object({
  buyerId: z.string().min(1, "Buyer is required"),
  projectId: z.string().min(1, "Project is required"),
  unitId: z.string().min(1, "Unit is required"),
  opportunityId: z.string().optional().nullable(),
  eoiId: z.string().optional().nullable(),
  basePrice: z.coerce.number().min(0),
  floorPremium: z.coerce.number().min(0).default(0),
  viewPremium: z.coerce.number().min(0).default(0),
  otherFees: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  finalPrice: z.coerce.number().min(0),
  currency: z.string().default("AED"),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
});

// Payment Milestone
export const paymentMilestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  percentage: z.coerce.number().min(0).max(100),
  amount: z.coerce.number().min(0),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});

// Purchase Order
export const purchaseOrderSchema = z.object({
  buyerId: z.string().min(1, "Buyer is required"),
  projectId: z.string().min(1, "Project is required"),
  unitId: z.string().min(1, "Unit is required"),
  opportunityId: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  eoiId: z.string().optional().nullable(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  additionalCharges: z.coerce.number().min(0).default(0),
  finalAmount: z.coerce.number().min(0),
  downPayment: z.coerce.number().min(0).default(0),
  paymentPlan: z.string().optional(),
  notes: z.string().optional(),
});

// Activity
export const activitySchema = z.object({
  type: z.string().min(1, "Activity type is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  leadId: z.string().optional().nullable(),
  buyerId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
});

// Follow-Up
export const followUpSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.string().default("MEDIUM"),
  leadId: z.string().optional().nullable(),
  buyerId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  assignedToId: z.string().min(1, "Assignee is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type BuyerAccountInput = z.infer<typeof buyerAccountSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type UnitInput = z.infer<typeof unitSchema>;
export type EOIInput = z.infer<typeof eoiSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type PaymentMilestoneInput = z.infer<typeof paymentMilestoneSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;

