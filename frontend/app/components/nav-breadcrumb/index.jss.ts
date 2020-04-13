import {styleSheet, asJss} from '../../util/jss';
import {theme} from '../../util/jss/theme';

const jss = asJss({
  navBreadcrumb: {
    display: `flex`,
    padding: `.5rem 0`,
  },
  crumb: {
    padding: `0.5rem`,
    cursor: `pointer`,

    '&:hover': {
      backgroundColor: theme.colorGrayLightest,
      color: theme.colorBlue,
    },
  },
  crumbArrow: {
    height: `100%`,
    alignSelf: `center`,
  },
});

export default styleSheet(jss, __filename);
