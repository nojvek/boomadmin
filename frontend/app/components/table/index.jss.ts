import {styleSheet, asJss} from '../../util/jss';
import {theme, overflowEllipsis} from '../../util/jss/theme';

const jss = asJss({
  table: {
    margin: `1rem`,
    marginTop: 0,
    position: `relative`,
    tableLayout: `fixed`,
    textAlign: `left`,
  },
  th: {
    ...overflowEllipsis,
    background: `#ddd`,
    borderRight: `1px solid #ccc`,
    cursor: `pointer`,
    padding: `5px 10px`,
    position: `sticky`,
    top: `0`,
    whiteSpace: `nowrap`,
  },
  td: {
    ...overflowEllipsis,
    border: `1px solid ${theme.colorGrayLighter}`,
    padding: `5px 10px`,
    whiteSpace: `nowrap`,
  },
  tr: {
    cursor: `pointer`,

    '&:hover': {
      backgroundColor: theme.colorGrayLightest,
    },
  },
});

export default styleSheet(jss, __filename);
