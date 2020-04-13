/** returns whether object is a plain javascript object or array that could be JSON.stringify-ied */
export function isPojo(value: any) {
  // in js, (typeof null === `object) dafuq!
  if (value !== null && typeof value === `object`) {
    const constructor = value.constructor;
    if (constructor === Object || constructor === Array) {
      return true;
    }
  }
  return false;
}

export function jsonStringifyIfPojo(value: any, pretty = false): string | number | boolean {
  if (isPojo(value)) {
    return pretty ? JSON.stringify(value, null, `  `) : JSON.stringify(value);
  }
  return value;
}
