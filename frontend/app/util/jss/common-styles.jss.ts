import {styleSheet} from './index';
import {theme} from './theme';

export const jss = {
  aLink: {
    color: theme.colorBlue,
    textDecoration: `none`,

    '&:hover': {
      textDecoration: `underline`,
    },

    // -xyz implies modifier
    '&.-block': {
      display: `block`,
    },
  },

  aAsDiv: {
    display: `block`,
    color: `inherit`,
    textDecoration: `none`,

    '&:hover': {
      textDecoration: `none`,
    },
  },

  item: {
    padding: `0.5rem 1rem`,
  },

  selectableItem: {
    cursor: `pointer`,

    '&:hover': {
      backgroundColor: theme.colorGrayLightest,
      color: theme.colorBlue,
    },
  },

  itemSelected: {
    color: theme.colorBlue,
    fontWeight: theme.fontWeightBold,
  },
};

export default styleSheet(jss, __filename);
