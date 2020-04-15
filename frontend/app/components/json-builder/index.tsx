import {h, Component, Fragment} from 'preact';
import cx from 'classnames';

import styles from './index.jss';

export const enum IconName {
  ChevronDown,
  ChevronRight,
  Cross,
}

const iconSvgs = {
  [IconName.ChevronDown]: require(`@fortawesome/fontawesome-pro/svgs/regular/chevron-down.svg`),
  [IconName.ChevronRight]: require(`@fortawesome/fontawesome-pro/svgs/regular/chevron-right.svg`),
  [IconName.Cross]: require(`@fortawesome/fontawesome-pro/svgs/regular/cross.svg`),
};

export function IconBtn({icon, onClick}: {icon: IconName; onClick?: () => void}) {
  return <span class={styles.iconBtn} dangerouslySetInnerHTML={{__html: iconSvgs[icon]}} onClick={onClick}></span>;
}

function NullView() {
  return <span class={styles.null}>null</span>;
}

function StringView({value}: {value: string}) {
  return <span class={styles.string}>{value}</span>;
}

function NumberView({value}: {value: number}) {
  return <span class={styles.number}>{value}</span>;
}

function BooleanView({value}: {value: boolean}) {
  return <span class={styles.boolean}>{JSON.stringify(value)}</span>;
}

function ObjectView({value}: {value: any}) {
  return (
    <div class={styles.object}>
      {Object.entries(value).map(([prop, val]) => (
        <ValueView key={prop} prop={prop} value={val} />
      ))}
    </div>
  );
}

interface ValueViewProps {
  prop?: string;
  value: any;
}

interface ValueViewState {
  expandedProps: Set<string>;
}

class ValueView extends Component<ValueViewProps, ValueViewState> {
  state: ValueViewState = {
    expandedProps: new Set(),
  };

  handleChevronClick = (prop: string) => {
    const {expandedProps} = this.state;
    expandedProps.has(prop) ? expandedProps.delete(prop) : expandedProps.add(prop);
    this.setState({expandedProps});
  };

  render() {
    const {value, prop} = this.props;
    const {expandedProps} = this.state;

    let objType = null;
    let propExpanded = false;

    if (value !== null && typeof value === `object`) {
      propExpanded = expandedProps.has(prop);
      const constructor = value.constructor;

      if (constructor === Array) {
        objType = `Array(${value.length})`;
      } else {
        const objKeys = Object.keys(value);
        objType = `Object(${objKeys.length > 3 ? objKeys.slice(0, 3).join(`, `) + `, …` : objKeys.join(`, `)})`;
      }
    }

    return (
      <div class={styles.keyval}>
        {objType ? (
          <IconBtn
            icon={propExpanded ? IconName.ChevronDown : IconName.ChevronRight}
            onClick={() => this.handleChevronClick(prop)}
          />
        ) : null}
        {prop ? (
          <Fragment>
            <span class={styles.key}>{prop}</span>
            <span class={styles.syntax}>: </span>
          </Fragment>
        ) : null}
        {objType ? (
          <span class={styles.objType} onClick={() => this.handleChevronClick(prop)}>
            {objType}
          </span>
        ) : null}
        {value === null ? (
          <NullView />
        ) : typeof value === `string` ? (
          <StringView value={value} />
        ) : typeof value === `number` ? (
          <NumberView value={value} />
        ) : typeof value === `boolean` ? (
          <BooleanView value={value} />
        ) : typeof value === `object` && propExpanded ? (
          <ObjectView value={value} />
        ) : null}
      </div>
    );
  }
}

export interface JsonBuilderProps<ValueT> {
  value: ValueT;
  onValueChange?: (newValue: ValueT) => void;
}

export class JsonBuilder<ValueT> extends Component<JsonBuilderProps<ValueT>, {}> {
  render() {
    const {value} = this.props;

    return (
      <div class={cx(styles.JsonBuilder)}>
        <ValueView value={value} />
      </div>
    );
  }
}
