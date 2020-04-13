import {styleSheet, asJss} from '../../util/jss';
import {thinBorder, theme} from '../../util/jss/theme';

const jss = asJss({
  clauseBuilder: {
    margin: `1rem`,
  },
  objectView: {
    display: `grid`,
    gridTemplateColumns: `min-content auto`,
    gridGap: `0.5rem`,
  },
  objectPropName: {
    textAlign: `right`,
  },
  borderBox: {
    border: thinBorder,
    padding: `0.5rem`,
  },
  removable: {
    display: `inline-flex`,
    flexDirection: `row`,
    marginRight: `0.5rem`,
  },
  xBtn: {
    color: theme.colorGrayLighter,
    cursor: `pointer`,
    padding: `0 0.5rem`,

    '&:hover': {
      backgroundColor: theme.colorGrayLightest,
      color: `red`,
    },
  },
});

export default styleSheet(jss, __filename);
