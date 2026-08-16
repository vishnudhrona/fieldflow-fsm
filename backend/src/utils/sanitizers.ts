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
