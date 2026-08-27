export const sanitizeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

export const sanitizeEmail = (value: unknown): string => {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
};

export const sanitizeOptionalString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

export const sanitizeBoolean = (value: unknown, defaultValue = true): boolean => {
  return value !== undefined ? Boolean(value) : defaultValue;
};

export const isValidUuid = (val: any): val is string => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};
