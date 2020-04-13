import {h, Component} from 'preact';
import cx from 'classnames';
import {DragRule, DragRulePosition} from '../drag-rule';
import styles from './index.jss';
import commonStyles from '../../util/jss/common-styles.jss';

export interface TableColumn<RowT> {
  /** column label to show in UI */
  label: string;

  /** how to show row value */
  valueFn: (row: RowT) => string | number;

  /** show value as link if hrefFn returns a string */
  hrefFn?: (row: RowT) => string;
}

export interface TableProps<RowT = any> {
  columns: Array<TableColumn<RowT>>;
  rows: RowT[];
  onRowSelect?: (row: RowT, rowIdx?: number) => void;
  onColumnSelect?: (column: TableColumn<RowT>) => void;
}

interface TableState {
  colWidths: Record<string, number>;
  defaultColWidth: number;
}

export class Table<RowT> extends Component<TableProps<RowT>, TableState> {
  state: TableState = {
    colWidths: {},
    defaultColWidth: 150,
  };

  handleRowClick = (row: any, rowIdx: number) => {
    this.props.onRowSelect?.(row, rowIdx);
  };

  handleColumnClick = (column: TableColumn<RowT>) => {
    this.props.onColumnSelect?.(column);
  };

  handleColumnWidthChange = (width: number, colLabel: string) => {
    const {colWidths} = this.state;
    colWidths[colLabel] = width;
    this.setState({colWidths});
  };

  getColumnWidth(colLabel: string): number {
    const {colWidths, defaultColWidth} = this.state;
    return colWidths[colLabel] || defaultColWidth;
  }

  render() {
    const {columns, rows} = this.props;
    const {colWidths, defaultColWidth} = this.state;

    // we need to calculate total table width + individual column widths for column resizing to work
    let tableWidth = 0;
    const colGroupCols = columns.map((col) => {
      const colWidth = colWidths[col.label] || defaultColWidth;
      tableWidth += colWidth;
      return <col style={{width: `${colWidth}px`}} />;
    });

    return (
      <table class={cx(`Table`, styles.table)} style={{width: `${tableWidth}px`}}>
        <colgroup>{colGroupCols}</colgroup>
        <tbody>
          <tr class={styles.tr}>
            {columns.map((col) => (
              <th class={styles.th}>
                <span onClick={() => this.handleColumnClick(col)}>{col.label}</span>
                <DragRule
                  position={DragRulePosition.Right}
                  curValue={this.getColumnWidth(col.label)}
                  minValue={50}
                  onValueChange={(width) => this.handleColumnWidthChange(width, col.label)}
                />
              </th>
            ))}
          </tr>

          {rows.length
            ? rows.map((row, rowIdx) => (
                <tr class={styles.tr} onClick={() => this.handleRowClick(row, rowIdx)}>
                  {columns.map((col) => {
                    const href = col.hrefFn?.(row);
                    const value = col.valueFn(row);
                    return (
                      <td class={styles.td}>
                        {href ? (
                          <a class={commonStyles.aLink} href={href}>
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            : `This table is empty!`}
        </tbody>
      </table>
    );
  }
}
