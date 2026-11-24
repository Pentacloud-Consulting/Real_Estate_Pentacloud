// Lead Sources
export const LEAD_SOURCES = [
  { value: "WEBSITE", label: "Website Form" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GOOGLE", label: "Google Search" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "WALK_IN", label: "Walk-In" },
  { value: "BROKER", label: "Broker" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
] as const;

// Lead Statuses
export const LEAD_STATUSES = [
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTED", label: "Contacted", color: "bg-cyan-100 text-cyan-800" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-green-100 text-green-800" },
  { value: "CONVERTED", label: "Converted", color: "bg-purple-100 text-purple-800" },
  { value: "UNQUALIFIED", label: "Unqualified", color: "bg-gray-100 text-gray-800" },
] as const;

// Lead Temperatures
export const LEAD_TEMPERATURES = [
  { value: "HOT", label: "Hot", color: "bg-red-100 text-red-800" },
  { value: "WARM", label: "Warm", color: "bg-amber-100 text-amber-800" },
  { value: "COLD", label: "Cold", color: "bg-blue-100 text-blue-800" },
] as const;

// Buyer Types
export const BUYER_TYPES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "CORPORATE", label: "Corporate" },
] as const;

// Property Types
export const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "COMMERCIAL", label: "Commercial" },
] as const;

// Unit Statuses
export const UNIT_STATUSES = [
  { value: "AVAILABLE", label: "Available", color: "bg-green-100 text-green-800" },
  { value: "RESERVED", label: "Reserved", color: "bg-amber-100 text-amber-800" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-orange-100 text-orange-800" },
  { value: "SOLD", label: "Sold", color: "bg-purple-100 text-purple-800" },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-100 text-red-800" },
  { value: "UNAVAILABLE", label: "Unavailable", color: "bg-gray-100 text-gray-800" },
] as const;

// Opportunity Stages
export const OPPORTUNITY_STAGES = [
  { value: "NEW", label: "New Opportunity", color: "bg-blue-100 text-blue-800" },
  { value: "DISCOVERY", label: "Discovery", color: "bg-cyan-100 text-cyan-800" },
  { value: "SHORTLISTED", label: "Property Shortlisted", color: "bg-teal-100 text-teal-800" },
  { value: "SITE_VISIT", label: "Site Visit", color: "bg-indigo-100 text-indigo-800" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-amber-100 text-amber-800" },
  { value: "EOI", label: "EOI", color: "bg-orange-100 text-orange-800" },
  { value: "RESERVED", label: "Reserved", color: "bg-yellow-100 text-yellow-800" },
  { value: "PURCHASE_ORDER", label: "Purchase Order", color: "bg-lime-100 text-lime-800" },
  { value: "CLOSED_WON", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "CLOSED_LOST", label: "Closed Lost", color: "bg-red-100 text-red-800" },
] as const;

// EOI Statuses
export const EOI_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "SUBMITTED", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "AWAITING_PAYMENT", label: "Awaiting Payment", color: "bg-amber-100 text-amber-800" },
  { value: "PAYMENT_PENDING_VERIFICATION", label: "Payment Pending Verification", color: "bg-orange-100 text-orange-800" },
  { value: "PAYMENT_VERIFIED", label: "Payment Verified", color: "bg-green-100 text-green-800" },
  { value: "RESERVATION_ACTIVE", label: "Reservation Active", color: "bg-emerald-100 text-emerald-800" },
  { value: "EXPIRED", label: "Expired", color: "bg-red-100 text-red-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
  { value: "CONVERTED_TO_PO", label: "Converted to PO", color: "bg-purple-100 text-purple-800" },
] as const;

// PO Statuses
export const PO_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "AWAITING_APPROVAL", label: "Awaiting Approval", color: "bg-amber-100 text-amber-800" },
  { value: "APPROVED", label: "Approved", color: "bg-blue-100 text-blue-800" },
  { value: "SENT", label: "Sent to Buyer", color: "bg-cyan-100 text-cyan-800" },
  { value: "AWAITING_SIGNATURE", label: "Awaiting Signature", color: "bg-indigo-100 text-indigo-800" },
  { value: "SIGNED", label: "Signed", color: "bg-teal-100 text-teal-800" },
  { value: "PAYMENT_PENDING", label: "Payment Pending", color: "bg-orange-100 text-orange-800" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-green-100 text-green-800" },
  { value: "CLOSED_WON", label: "Closed Won", color: "bg-emerald-100 text-emerald-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

// Quotation Statuses
export const QUOTATION_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "PENDING_APPROVAL", label: "Pending Approval", color: "bg-amber-100 text-amber-800" },
  { value: "APPROVED", label: "Approved", color: "bg-blue-100 text-blue-800" },
  { value: "SENT", label: "Sent", color: "bg-cyan-100 text-cyan-800" },
  { value: "ACCEPTED", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "EXPIRED", label: "Expired", color: "bg-gray-100 text-gray-800" },
] as const;

// Document Statuses
export const DOCUMENT_STATUSES = [
  { value: "PENDING_UPLOAD", label: "Pending Upload", color: "bg-gray-100 text-gray-800" },
  { value: "UPLOADED", label: "Uploaded", color: "bg-blue-100 text-blue-800" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "bg-amber-100 text-amber-800" },
  { value: "VERIFIED", label: "Verified", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "EXPIRED", label: "Expired", color: "bg-orange-100 text-orange-800" },
  { value: "RESUBMISSION_REQUIRED", label: "Resubmission Required", color: "bg-rose-100 text-rose-800" },
] as const;

// Onboarding Statuses
export const ONBOARDING_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started", color: "bg-gray-100 text-gray-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "PENDING_REVIEW", label: "Pending Review", color: "bg-amber-100 text-amber-800" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
] as const;

// Buyer Categories
export const BUYER_CATEGORIES = [
  { value: "INDIVIDUAL_RESIDENT", label: "Individual Resident / Local Buyer" },
  { value: "INDIVIDUAL_INTERNATIONAL", label: "Individual International / Non-Resident Buyer" },
  { value: "CORPORATE", label: "Corporate / Institutional Buyer" },
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "CASH", label: "Cash" },
] as const;

// Activity Types
export const ACTIVITY_TYPES = [
  { value: "CALL", label: "Phone Call", icon: "Phone" },
  { value: "EMAIL", label: "Email", icon: "Mail" },
  { value: "WHATSAPP", label: "WhatsApp", icon: "MessageCircle" },
  { value: "NOTE", label: "Note", icon: "StickyNote" },
  { value: "MEETING", label: "Meeting", icon: "Users" },
  { value: "SITE_VISIT", label: "Site Visit", icon: "MapPin" },
  { value: "FOLLOW_UP", label: "Follow-Up", icon: "Clock" },
  { value: "STATUS_CHANGE", label: "Status Change", icon: "RefreshCw" },
  { value: "ASSIGNMENT", label: "Assignment", icon: "UserPlus" },
  { value: "EOI_EVENT", label: "EOI Event", icon: "FileText" },
  { value: "RESERVATION_EVENT", label: "Reservation Event", icon: "Bookmark" },
  { value: "PAYMENT_EVENT", label: "Payment Event", icon: "DollarSign" },
  { value: "DOCUMENT_EVENT", label: "Document Event", icon: "File" },
  { value: "SYSTEM", label: "System", icon: "Settings" },
] as const;

// Follow-Up Statuses
export const FOLLOW_UP_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
  { value: "OVERDUE", label: "Overdue", color: "bg-red-100 text-red-800" },
] as const;

// User Roles
export const USER_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin / Operations Manager" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES_ADVISOR", label: "Sales Advisor" },
  { value: "FINANCE", label: "Finance" },
  { value: "COMPLIANCE", label: "Onboarding / Compliance Officer" },
  { value: "MANAGEMENT", label: "Management / Executive" },
] as const;

// Project Statuses
export const PROJECT_STATUSES = [
  { value: "PLANNING", label: "Planning", color: "bg-gray-100 text-gray-800" },
  { value: "PRE_LAUNCH", label: "Pre-Launch", color: "bg-cyan-100 text-cyan-800" },
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "SOLD_OUT", label: "Sold Out", color: "bg-purple-100 text-purple-800" },
  { value: "COMPLETED", label: "Completed", color: "bg-blue-100 text-blue-800" },
] as const;

// Purchase Purpose
export const PURCHASE_PURPOSES = [
  { value: "INVESTMENT", label: "Investment" },
  { value: "END_USE", label: "End Use" },
  { value: "BOTH", label: "Both" },
] as const;

// Area Units
export const AREA_UNITS = [
  { value: "SQFT", label: "sq. ft." },
  { value: "SQM", label: "sq. m." },
] as const;

// Reservation Statuses
export const RESERVATION_STATUSES = [
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "EXPIRED", label: "Expired", color: "bg-red-100 text-red-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
  { value: "CONVERTED", label: "Converted", color: "bg-purple-100 text-purple-800" },
] as const;

// Notification Types
export const NOTIFICATION_TYPES = [
  { value: "LEAD", label: "Lead" },
  { value: "FOLLOW_UP", label: "Follow-Up" },
  { value: "EOI", label: "EOI" },
  { value: "RESERVATION", label: "Reservation" },
  { value: "PAYMENT", label: "Payment" },
  { value: "DOCUMENT", label: "Document" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "SYSTEM", label: "System" },
] as const;

// Payment Statuses
export const PAYMENT_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "RECEIVED", label: "Received", color: "bg-blue-100 text-blue-800" },
  { value: "VERIFIED", label: "Verified", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
] as const;

// Sidebar Navigation
export const SIDEBAR_NAVIGATION = [
  { name: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "Leads", href: "/leads", icon: "Users" },
  { name: "Buyers", href: "/buyers", icon: "UserCheck" },
  { name: "Opportunities", href: "/opportunities", icon: "TrendingUp" },
  { name: "Projects", href: "/projects", icon: "Building2" },
  { name: "Inventory", href: "/inventory", icon: "Boxes" },
  { name: "EOI & Reservations", href: "/eoi", icon: "FileSignature" },
  { name: "Quotations", href: "/quotations", icon: "Receipt" },
  { name: "Purchase Orders", href: "/purchase-orders", icon: "ShoppingCart" },
  { name: "Onboarding", href: "/onboarding", icon: "ClipboardCheck" },
  { name: "Document Vault", href: "/documents", icon: "FolderLock" },
  { name: "Activities", href: "/activities", icon: "Activity" },
  { name: "Reports", href: "/reports", icon: "BarChart3" },
  { name: "Settings", href: "/settings", icon: "Settings" },
] as const;

// Individual Resident Documents
export const INDIVIDUAL_RESIDENT_DOCS = [
  { name: "Valid National ID / Emirates ID — Front and Back", isRequired: true },
  { name: "Valid Passport Copy", isRequired: true },
  { name: "Proof of Current Residential Address — Utility Bill or Tenancy Contract", isRequired: true },
  { name: "Signed KYC & Source of Funds Declaration Form", isRequired: true },
  { name: "Down-Payment Transfer Receipt / Cheque Copy", isRequired: true },
];

// Individual International Documents
export const INDIVIDUAL_INTERNATIONAL_DOCS = [
  { name: "Valid Passport Copy — Minimum 6 months validity", isRequired: true },
  { name: "National ID / Tax ID from Home Country", isRequired: true },
  { name: "Proof of Overseas Residential Address", isRequired: true },
  { name: "Signed KYC & Source of Funds Declaration Form", isRequired: true },
  { name: "International Wire Transfer Swift Copy (MT103)", isRequired: true },
];

// Corporate Documents
export const CORPORATE_DOCS = [
  { name: "Valid Commercial Trade License / Certificate of Incorporation", isRequired: true },
  { name: "Memorandum & Articles of Association (MOA / AOA)", isRequired: true },
  { name: "Board Resolution Authorizing Property Purchase", isRequired: true },
  { name: "Passport & ID Copies of Authorized Signatory & Ultimate Beneficial Owners (UBOs)", isRequired: true },
  { name: "Company Tax Registration Certificate (TRN / VAT) & Bank Proof", isRequired: true },
];

