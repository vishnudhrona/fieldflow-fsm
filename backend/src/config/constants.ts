export const ROLES = {
  ADMIN_DISPATCHER: 'ADMIN_DISPATCHER',
  TECHNICIAN: 'TECHNICIAN'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
