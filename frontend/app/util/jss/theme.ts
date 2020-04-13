import {CssProps} from './index';

export const theme = {
  colorGrayLightest: `#f7f7f7`,
  colorGrayLighter: `#e5e5e5`,
  colorGray: `#6e6e6e`,
  colorWhite: `#fff`,
  colorBlue: `#1868fb`,
  colorRed: `#b12f3f`,

  fontSizeSmall: `.75rem`,

  fontWeightRegular: 300,
  fontWeightBold: 400,
  fontWeightBolder: 500,

  zIndexRule: 1000,
};

export const thinBorder = `1px solid ${theme.colorGrayLighter}`;

export const overflowEllipsis: CssProps = {
  overflow: `hidden`,
  textOverflow: `ellipsis`,
};
