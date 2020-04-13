import jss, {Rule} from 'jss';
import {Properties as CssProperties} from 'csstype';
import pluginCamelCase from 'jss-plugin-camel-case';
import pluginNested from 'jss-plugin-nested';
import pluginGlobal from 'jss-plugin-global';

export type CssProps = CssProperties<string | number>;

export type JSS = {
  // recursive definition so we can have completion for @media, @keyframes, &:hover e.t.c
  [className: string]: CssProps | JSS;
};

/**
 * Helper passthrough function that ensures that jss is typed
 * and vscode gives fantastic code completion
 */
export function asJss<T extends JSS>(jss: T): T {
  return jss;
}

/**
 * If eval-ed by node, then simply output the stylesheet as css
 */
const isBrowser = typeof window !== `undefined`;

// the special return type enables typescript to map rules in jss.ts to jsx
// this means we get great code completion and error checking
export function styleSheet<T>(styles: T, filename: string): {[C in keyof T]: string} {
  const sheet = jss.createStyleSheet(styles as any, {meta: filename});

  if (isBrowser) {
    sheet.attach();
  } else {
    // output will be sent to css-loader and then extracted to .css by miniextract
    const cssStr = sheet.toString();

    // generated class names will be sent to .js
    const exportStr = `:export {${Object.entries(sheet.classes)
      .map(([key, val]) => `${key}: ${val}`)
      .join(`;`)}}\n\n`;

    process.stdout.write(exportStr + cssStr);
  }

  return sheet.classes as {[C in keyof T]: string};
}

jss.setup({
  plugins: [pluginNested(), pluginGlobal(), pluginCamelCase()],
  createGenerateId: () => {
    // figure out proper counting in js -> css loader
    let counter = isBrowser ? 0 : Math.round(Math.random() * 1000);
    return (rule: Rule) => `${rule.key}_${counter++}`;
  },
});
