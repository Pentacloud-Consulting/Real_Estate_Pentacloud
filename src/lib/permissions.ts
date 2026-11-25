// Role-Based Access Control

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SALES_MANAGER"
  | "SALES_ADVISOR"
  | "FINANCE"
  | "COMPLIANCE"
  | "MANAGEMENT";

export type Permission =
  | "leads.view"
  | "leads.create"
  | "leads.edit"
  | "leads.delete"
  | "leads.assign"
  | "leads.qualify"
  | "leads.convert"
  | "leads.view_all"
  | "buyers.view"
  | "buyers.create"
  | "buyers.edit"
  | "buyers.delete"
  | "buyers.view_all"
  | "opportunities.view"
  | "opportunities.create"
  | "opportunities.edit"
  | "opportunities.delete"
  | "opportunities.view_all"
  | "projects.view"
  | "projects.create"
  | "projects.edit"
  | "projects.delete"
  | "inventory.view"
  | "inventory.create"
  | "inventory.edit"
  | "inventory.delete"
  | "eoi.view"
  | "eoi.create"
  | "eoi.edit"
  | "eoi.verify_payment"
  | "eoi.view_all"
  | "reservations.view"
  | "reservations.create"
  | "reservations.edit"
  | "reservations.cancel"
  | "quotations.view"
  | "quotations.create"
  | "quotations.edit"
  | "quotations.approve"
  | "purchase_orders.view"
  | "purchase_orders.create"
  | "purchase_orders.edit"
  | "purchase_orders.approve"
  | "purchase_orders.confirm"
  | "onboarding.view"
  | "onboarding.create"
  | "onboarding.edit"
  | "onboarding.verify_documents"
  | "onboarding.complete"
  | "documents.view"
  | "documents.upload"
  | "documents.verify"
  | "documents.reject"
  | "documents.download"
  | "reports.view"
  | "reports.export"
  | "settings.view"
  | "settings.edit"
  | "settings.users"
  | "settings.roles"
  | "activities.view"
  | "activities.create"
  | "notifications.view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "leads.view", "leads.create", "leads.edit", "leads.delete", "leads.assign", "leads.qualify", "leads.convert", "leads.view_all",
    "buyers.view", "buyers.create", "buyers.edit", "buyers.delete", "buyers.view_all",
    "opportunities.view", "opportunities.create", "opportunities.edit", "opportunities.delete", "opportunities.view_all",
    "projects.view", "projects.create", "projects.edit", "projects.delete",
    "inventory.view", "inventory.create", "inventory.edit", "inventory.delete",
    "eoi.view", "eoi.create", "eoi.edit", "eoi.verify_payment", "eoi.view_all",
    "reservations.view", "reservations.create", "reservations.edit", "reservations.cancel",
    "quotations.view", "quotations.create", "quotations.edit", "quotations.approve",
    "purchase_orders.view", "purchase_orders.create", "purchase_orders.edit", "purchase_orders.approve", "purchase_orders.confirm",
    "onboarding.view", "onboarding.create", "onboarding.edit", "onboarding.verify_documents", "onboarding.complete",
    "documents.view", "documents.upload", "documents.verify", "documents.reject", "documents.download",
    "reports.view", "reports.export",
    "settings.view", "settings.edit", "settings.users", "settings.roles",
    "activities.view", "activities.create",
    "notifications.view",
  ],
  ADMIN: [
    "leads.view", "leads.create", "leads.edit", "leads.delete", "leads.assign", "leads.qualify", "leads.convert", "leads.view_all",
    "buyers.view", "buyers.create", "buyers.edit", "buyers.view_all",
    "opportunities.view", "opportunities.create", "opportunities.edit", "opportunities.view_all",
    "projects.view", "projects.create", "projects.edit",
    "inventory.view", "inventory.create", "inventory.edit",
    "eoi.view", "eoi.create", "eoi.edit", "eoi.verify_payment", "eoi.view_all",
    "reservations.view", "reservations.create", "reservations.edit", "reservations.cancel",
    "quotations.view", "quotations.create", "quotations.edit", "quotations.approve",
    "purchase_orders.view", "purchase_orders.create", "purchase_orders.edit", "purchase_orders.approve", "purchase_orders.confirm",
    "onboarding.view", "onboarding.create", "onboarding.edit", "onboarding.verify_documents", "onboarding.complete",
    "documents.view", "documents.upload", "documents.verify", "documents.reject", "documents.download",
    "reports.view", "reports.export",
    "settings.view",
    "activities.view", "activities.create",
    "notifications.view",
  ],
  SALES_MANAGER: [
    "leads.view", "leads.create", "leads.edit", "leads.assign", "leads.qualify", "leads.convert", "leads.view_all",
    "buyers.view", "buyers.create", "buyers.edit", "buyers.view_all",
    "opportunities.view", "opportunities.create", "opportunities.edit", "opportunities.view_all",
    "projects.view",
    "inventory.view",
    "eoi.view", "eoi.create", "eoi.edit", "eoi.view_all",
    "reservations.view", "reservations.create",
    "quotations.view", "quotations.create", "quotations.edit", "quotations.approve",
    "purchase_orders.view", "purchase_orders.create",
    "onboarding.view",
    "documents.view", "documents.upload", "documents.download",
    "reports.view", "reports.export",
    "activities.view", "activities.create",
    "notifications.view",
  ],
  SALES_ADVISOR: [
    "leads.view", "leads.create", "leads.edit", "leads.qualify", "leads.convert",
    "buyers.view", "buyers.create", "buyers.edit",
    "opportunities.view", "opportunities.create", "opportunities.edit",
    "projects.view",
    "inventory.view",
    "eoi.view", "eoi.create", "eoi.edit",
    "reservations.view",
    "quotations.view", "quotations.create", "quotations.edit",
    "purchase_orders.view", "purchase_orders.create", "purchase_orders.edit",
    "onboarding.view",
    "documents.view", "documents.upload", "documents.download",
    "reports.view",
    "activities.view", "activities.create",
    "notifications.view",
  ],
  FINANCE: [
    "leads.view",
    "buyers.view",
    "opportunities.view",
    "projects.view",
    "inventory.view",
    "eoi.view", "eoi.verify_payment", "eoi.view_all",
    "reservations.view",
    "quotations.view",
    "purchase_orders.view", "purchase_orders.confirm",
    "onboarding.view",
    "documents.view", "documents.download",
    "reports.view", "reports.export",
    "activities.view",
    "notifications.view",
  ],
  COMPLIANCE: [
    "leads.view",
    "buyers.view",
    "opportunities.view",
    "projects.view",
    "inventory.view",
    "eoi.view",
    "reservations.view",
    "quotations.view",
    "purchase_orders.view",
    "onboarding.view", "onboarding.edit", "onboarding.verify_documents", "onboarding.complete",
    "documents.view", "documents.upload", "documents.verify", "documents.reject", "documents.download",
    "reports.view",
    "activities.view", "activities.create",
    "notifications.view",
  ],
  MANAGEMENT: [
    "leads.view", "leads.view_all",
    "buyers.view", "buyers.view_all",
    "opportunities.view", "opportunities.view_all",
    "projects.view",
    "inventory.view",
    "eoi.view", "eoi.view_all",
    "reservations.view",
    "quotations.view",
    "purchase_orders.view",
    "onboarding.view",
    "documents.view", "documents.download",
    "reports.view", "reports.export",
    "activities.view",
    "notifications.view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function canViewAllRecords(role: Role, module: string): boolean {
  const viewAllPermission = `${module}.view_all` as Permission;
  return hasPermission(role, viewAllPermission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: insufficient permissions for ${permission}`);
  }
}

