import {h, Component, Fragment} from 'preact';
import cx from 'classnames';
import styles from './index.jss';
import commonStyles from '../../util/jss/common-styles.jss';

export interface BreadcrumbItem {
  /** label to show on the ui */
  label: string;

  /** update location href when selected */
  href?: string;

  /** reference to the user defined value */
  value?: any;
}

export interface NavBreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect?: (item: BreadcrumbItem) => void;
}

export class NavBreadcrumb extends Component<NavBreadcrumbProps, {}> {
  handleItemClick = (item: BreadcrumbItem) => {
    this.props.onSelect?.(item);
  };

  render() {
    const {items} = this.props;
    return (
      <div class={cx(`NavBreadcrumb`, styles.navBreadcrumb)}>
        {items.map((item, idx, items) => {
          const showAsLink = idx < items.length; // show all as links (for the time being)
          return (
            <Fragment>
              {h(
                showAsLink ? `a` : `div`,
                {
                  class: cx({
                    [commonStyles.item]: true,
                    [commonStyles.selectableItem]: showAsLink,
                    [commonStyles.aAsDiv]: showAsLink,
                  }),
                  onClick: () => this.handleItemClick(item),
                  ...(item.href ? {href: item.href} : null),
                },
                item.label,
              )}
              {idx < items.length - 1 ? <div class={styles.crumbArrow}>></div> : null}
            </Fragment>
          );
        })}
      </div>
    );
  }
}
