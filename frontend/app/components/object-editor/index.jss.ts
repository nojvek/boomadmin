import {styleSheet, asJss} from '../../util/jss';
import {theme, thinBorder} from '../../util/jss/theme';
import {jss as commonJss} from '../../util/jss/common-styles.jss';

const jss = asJss({
  objectEditor: {
    flexGrow: 1,
    height: 0, // TODO: figure out proper panel layout
    wordBreak: `break-word`,
  },
  fieldsView: {
    padding: `1rem`,
  },
  referencesView: {
    borderTop: thinBorder,
    padding: `1rem`,
  },
  viewTitle: {
    marginBottom: `1rem`,
  },
  fieldWrapper: {
    marginBottom: `1rem`,
  },
  fieldName: {
    fontWeight: theme.fontWeightBold,
    marginBottom: `.5rem`,
  },
  fieldValue: {
    color: theme.colorGray,
    backgroundColor: theme.colorWhite,
    padding: `.5rem`,
    whiteSpace: `pre-wrap`,
  },
  fkReference: {
    ...commonJss.aLink,
    display: `block`,
    marginBottom: `1rem`,
  },
});

export default styleSheet(jss, __filename);
