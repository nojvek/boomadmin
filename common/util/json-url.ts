// the following are the unescaped chars
// encodeURIComponent: [-A-Za-z0-9_.!~*'()]
// encodeURI: [{encodeURIComponent}[],/?:@&=+$#]
// special chars for json url [~()'_]
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent

function hexEncodeChar(char: string): string {
  return `%${char.charCodeAt(0).toString(16)}`;
}

/** %hex encodes the string except a few url safe characters (minus [~()'+] that we use for json encoding)  */
function hexEncodeStr(str: string): string {
  return str.replace(/[^-a-zA-Z0-9_.!*,/?:@&=$]/g, hexEncodeChar);
}

// a simple substitution of existing JSON.stringify chars into url safe chars
const decodeJsonCharsMap: Record<string, string> = {
  '+': ` `,
  "'": `"`,
  '~(': `[`,
  ')~': `]`,
  '(': `{`,
  ')': `}`,
};

// a reverse of decode map i.e %hex -> char
const encodeJsonCharsMap = Object.fromEntries(
  Object.entries(decodeJsonCharsMap).map(([findChr, replaceChr]) => [hexEncodeChar(replaceChr), findChr]),
);

/**
 * Rather than using rison or jsurl, the idea here is we simply call JSON.stringify and replace some chars to url safe
 * It produces easy to read and easy+fast to decode urls. It doesn't produce the shortest url
 */
export function jsonUrlEncode(val: any): string {
  const jsonStr = JSON.stringify(val);
  const hexStr = hexEncodeStr(jsonStr);
  const encodeRegex = new RegExp(Object.keys(encodeJsonCharsMap).join(`|`), `g`);
  const encodedStr = hexStr.replace(encodeRegex, (c) => encodeJsonCharsMap[c]);
  return encodedStr;
}

export function jsonUrlDecode(str: string): any {
  const decodeRegex = new RegExp(
    Object.keys(decodeJsonCharsMap)
      .map((char) => char.replace(/[()+]/, (c) => `\\${c}`))
      .join(`|`),
    `g`,
  );

  const decodedStr = str.replace(decodeRegex, (c) => decodeJsonCharsMap[c]);
  const jsonStr = decodeURIComponent(decodedStr);
  let val = null;

  try {
    val = JSON.parse(jsonStr);
  } catch (err) {
    // log if str is bad
    console.error(decodedStr);
    throw err;
  }

  return val;
}
