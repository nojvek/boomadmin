export function toCamelCase(s: string): string {
  return s.toLowerCase().replace(/([-_][a-z])/g, ($1) => {
    return $1
      .toUpperCase()
      .replace(`-`, ``)
      .replace(`_`, ``);
  });
}

export function camelCaseObj(obj: {[key: string]: any}): {[key: string]: any} {
  const result: {[key: string]: any} = {};
  for (const key of Object.keys(obj)) {
    result[toCamelCase(key)] = obj[key];
  }
  return result;
}

export function truncateWithEllipsis(str: string, maxLen = 100): string {
  const ellipsis = `...`;
  if (str.length > maxLen - ellipsis.length) {
    str = str.substr(0, maxLen) + ellipsis;
  }
  return str;
}
