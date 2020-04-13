import {h, Component} from 'preact';
import cx from 'classnames';
import commonStyles from '../../util/jss/common-styles.jss';
import styles from './index.jss';

export interface ItemListItem {
  /** label to show on the ui */
  label: string;

  /** whether item is selected */
  selected: boolean;

  /** update location hash when selected */
  href?: string;

  /** reference to the user defined value */
  value?: any;
}

export interface ItemListProps {
  items: ItemListItem[];

  onSelect?: (item: ItemListItem) => void;
}

interface ItemListState {
  searchFilter?: string;
}

// TODO: replace with fuzzbunny when ready
function getMatchParts(label: string, searchFilter: string): string[] {
  const index = label.indexOf(searchFilter);
  const searchLen = searchFilter.length;

  if (searchLen > 0) {
    return [label.substr(0, index), label.substr(index, searchLen), label.substr(index + searchLen)];
  } else {
    return [label];
  }
}

export class ItemList extends Component<ItemListProps, ItemListState> {
  state: ItemListState = {
    searchFilter: ``,
  };

  handleItemClick = (item: ItemListItem) => {
    this.props.onSelect?.(item);
    if (item.href) {
      location.href = item.href;
    }
  };

  handleSearchInput = (ev: Event) => {
    this.setState({searchFilter: (ev.target as HTMLInputElement).value});
  };

  render() {
    const {items} = this.props;
    const {searchFilter} = this.state;

    return (
      <div class={styles.itemList}>
        <div>
          <input
            class={styles.searchInput}
            placeholder={`Search`}
            value={searchFilter}
            onInput={this.handleSearchInput}
          />
        </div>
        <div class={styles.items}>
          {items
            .filter((item) => item.label.includes(searchFilter))
            .map((item) =>
              // conditionally render anchor tag if item has an href
              h(
                item.href ? `a` : `div`,
                {
                  class: cx({
                    [commonStyles.item]: true,
                    [commonStyles.selectableItem]: true,
                    [commonStyles.itemSelected]: item.selected,
                    [commonStyles.aAsDiv]: !!item.href,
                  }),
                  onClick: () => this.handleItemClick(item),
                  ...(item.href ? {href: item.href} : null),
                },
                getMatchParts(item.label, searchFilter).map((part) => <span class={styles.matchPart}>{part}</span>),
              ),
            )}
        </div>
      </div>
    );
  }
}
