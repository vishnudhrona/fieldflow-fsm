import { isValidElement } from 'react';

export function mapObjectValues<T = any>(
  obj: any,
  fnOrKeys?: ((val: string) => any) | string[],
  maybeKeys?: string[]
): T {
  if (typeof obj !== 'object' || obj === null || isValidElement(obj)) {
    return obj;
  }

  let fn: (val: string) => any = (val) => val;
  let keys: string[] = [];

  if (typeof fnOrKeys === 'function') {
    fn = fnOrKeys;
    keys = Array.isArray(maybeKeys) ? maybeKeys : [];
  } else if (Array.isArray(fnOrKeys)) {
    keys = fnOrKeys;
    fn = (val) => val;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapObjectValues(item, fn, keys)) as unknown as T;
  }

  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null && !isValidElement(value)) {
        newObj[key] = mapObjectValues(value, fn, keys);
      } else {
        newObj[key] = keys.includes(key) && typeof value === 'string' ? fn(value) : value;
      }
    }
  }

  return newObj as T;
}

export default mapObjectValues;
