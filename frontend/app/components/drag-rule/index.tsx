import {h, Component} from 'preact';
import cx from 'classnames';

import styles from './index.jss';

export const enum DragRulePosition {
  Top = `top`,
  Bottom = `bottom`,
  Left = `left`,
  Right = `right`,
}

export interface DragRuleProps {
  position: DragRulePosition;
  minValue?: number;
  maxValue?: number;
  curValue: number;
  onValueChange?: (newValue: number) => void;
}

export class DragRule extends Component<DragRuleProps, {}> {
  private lastClientPos = -1;
  private onDragRafId = -1;

  handleMouseDown = (ev: MouseEvent) => {
    this.lastClientPos = this.isXMovement() ? ev.clientX : ev.clientY;

    document.body.addEventListener(`mousemove`, this.handleBodyMouseMove);
    document.body.addEventListener(`mouseup`, this.handleBodyMouseUp);
    document.body.addEventListener(`mouseleave`, this.handleBodyMouseUp);
  };

  handleBodyMouseMove = (ev: MouseEvent) => {
    const {
      onValueChange,
      curValue,
      minValue = Number.NEGATIVE_INFINITY,
      maxValue = Number.POSITIVE_INFINITY,
      position,
    } = this.props;
    const clientPos = this.isXMovement() ? ev.clientX : ev.clientY;
    const posDiff = clientPos - this.lastClientPos;
    const directionMultiplier = position === DragRulePosition.Right || position === DragRulePosition.Bottom ? 1 : -1;
    const newValue = Math.max(Math.min(curValue + posDiff * directionMultiplier, maxValue), minValue);

    if (newValue !== curValue && typeof onValueChange === `function`) {
      window.cancelAnimationFrame(this.onDragRafId);
      this.onDragRafId = window.requestAnimationFrame(() => {
        onValueChange(newValue);
        this.lastClientPos += (newValue - curValue) * directionMultiplier;
      });
    }
  };

  handleBodyMouseUp = () => {
    document.body.removeEventListener(`mousemove`, this.handleBodyMouseMove);
    document.body.removeEventListener(`mouseup`, this.handleBodyMouseUp);
    document.body.removeEventListener(`mouseleave`, this.handleBodyMouseUp);
  };

  isXMovement(): boolean {
    const {position} = this.props;
    return position === DragRulePosition.Left || position === DragRulePosition.Right;
  }

  componentWillUnmount() {
    this.handleBodyMouseUp();
  }

  render() {
    const {position: direction} = this.props;
    return <div class={cx(styles.dragRule, styles[direction])} onMouseDown={this.handleMouseDown}></div>;
  }
}
