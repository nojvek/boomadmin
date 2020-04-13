import {styleSheet, asJss} from '../../util/jss';

const ruleSize = `4px`;
const jss = asJss({
  dragRule: {
    position: `absolute`,
    userSelect: `none`,
  },
  top: {
    cursor: `row-resize`,
    height: ruleSize,
    left: 0,
    top: 0,
    width: `100%`,
  },
  bottom: {
    cursor: `row-resize`,
    height: ruleSize,
    left: 0,
    bottom: 0,
    width: `100%`,
  },
  left: {
    cursor: `col-resize`,
    height: `100%`,
    left: 0,
    top: 0,
    width: ruleSize,
  },
  right: {
    cursor: `col-resize`,
    height: `100%`,
    right: 0,
    top: 0,
    width: ruleSize,
  },
});

export default styleSheet(jss, __filename);
