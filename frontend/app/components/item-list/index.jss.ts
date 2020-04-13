import {styleSheet, asJss} from '../../util/jss';
import {theme} from '../../util/jss/theme';

const jss = asJss({
  itemList: {
    display: `flex`,
    flexDirection: `column`,
    height: `100%`,
  },
  searchInput: {
    margin: `0.5rem`,
    width: `calc(100% - 1rem)`,
    padding: `0.5rem 1rem`,
    fontSize: `inherit`,
    borderRadius: `.25rem`,
    border: `1px solid ${theme.colorGrayLighter}`,
    color: theme.colorGray,
  },
  items: {
    flexGrow: 1,
    overflow: `auto`,
    height: 0,
  },
  matchPart: {
    '&:nth-child(even)': {
      fontWeight: theme.fontWeightBolder,
    },
  },
});

export default styleSheet(jss, __filename);
