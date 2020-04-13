import {styleSheet, asJss, CssProps} from './util/jss';
import {thinBorder, theme} from './util/jss/theme';

const pane: CssProps = {
  position: `relative`,
  borderRight: thinBorder,
};

// const debugBorder: CssProps = {border: `1px solid red`};

const jss = asJss({
  app: {
    display: `flex`,
    flexDirection: `column`,
    width: `100vw`, // 100vw & 100vh, let the app behave like a desktop app
    height: `100vh`,
    backgroundColor: theme.colorGrayLightest,
  },
  headerBar: {
    borderBottom: thinBorder,
    display: `flex`,
  },
  headerBarBreadcrumb: {
    flexGrow: 1,
  },
  headerBarActions: {
    display: `flex`,
    alignItems: `center`,
  },
  headerBarActionLabel: {
    marginLeft: `.5rem`,
    marginRight: `1rem`,
  },
  bodyPanes: {
    display: `flex`,
    flexGrow: 1,
    height: `100%`,
    borderBottom: thinBorder,
  },
  navPane: {
    ...pane,
    overflow: `auto`,
  },
  mainPane: {
    ...pane,
    display: `flex`,
    flexDirection: `column`,
    flexGrow: 1,
    height: `100%`,
    overflow: `auto`,
    backgroundColor: theme.colorWhite,
  },
  detailPane: {
    ...pane,
    overflow: `auto`,
    display: `flex`,
    flexDirection: `column`,
  },
  errorPre: {
    color: theme.colorRed,
    whiteSpace: `pre-wrap`,
  },
  breadCrumbs: {},
  queryPanel: {},
  tablePanel: {
    flexGrow: 1,
    height: 0, // this is how fixing dumb CSS feels like https://twitter.com/zenorocha/status/1247949538674892802
    overflow: `auto`,
  },
  statusPanel: {
    padding: `0.5rem 1rem`,
    fontSize: theme.fontSizeSmall,
    color: theme.colorGray,
    borderTop: thinBorder,
    backgroundColor: theme.colorGrayLightest,
  },
});

export default styleSheet(jss, __filename);
