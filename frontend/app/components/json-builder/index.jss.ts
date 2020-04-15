import {styleSheet, asJss} from '../../util/jss';

const jss = asJss({
  JsonBuilder: {
    margin: `2rem`,
    fontFamily: `Menlo, Monaco, 'Courier New', monospace`,
  },
  null: {
    color: `#F08852`,
  },
  string: {
    color: `#ED596F`,
  },
  number: {
    color: `#6C4AC1`,
  },
  boolean: {
    color: `#3379F6`,
  },
  key: {
    color: `#396EBE`,
  },
  object: {
    marginLeft: `1rem`,
  },
  keyval: {
    position: `relative`,
    paddingTop: `5px`,
  },
  syntax: {
    color: `#C7D0E4`,
  },
  objType: {
    cursor: `pointer`,
    color: `#B1B7C5`,
    userSelect: `none`,

    '&:hover': {
      background: `#EEE`,
    },
  },
  iconBtn: {
    position: `absolute`,
    cursor: `pointer`,
    left: `-20px`,

    '&:hover': {
      background: `#EEE`,
    },

    '&>svg': {
      width: `18px`,
      height: `18px`,

      '& path': {
        fill: `#B1B7C5`,
      },
    },
  },
});

export default styleSheet(jss, __filename);
