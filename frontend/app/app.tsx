if (IS_DEV) require(`preact/debug`); // for preact devtools
import {h, render, Component} from 'preact';

import {DbSchema, DbTable} from 'common/api/db-schema';
import {jsonStringifyIfPojo} from 'common/util/pojo';
import {CountForeignReferencesResult} from 'common/api/api-types';
import {SelectQuery} from 'common/api/sql-types';
import {getDbSchema, selectFromTable, countForeignReferences} from './api/query';
import {parseUrlState, makeHref, UrlState, SchemaTable, setLocationHash} from './util/url-state';
import {InspectablePromise} from './util/inspectable-promise';
import {sqlSelectSchemaFromDbSchema} from './util/select-schema';
import './app.scss'; // import before components since minireset css is loaded by app.jss
import styles from './app.jss';
import {ItemList, ItemListItem} from './components/item-list';
import {NavBreadcrumb, BreadcrumbItem} from './components/nav-breadcrumb';
import {Table, TableColumn, TableProps} from './components/table';
import {ClauseBuilder} from './components/clause-builder';
import {ObjectEditor} from './components/object-editor';
import {DragRule, DragRulePosition} from './components/drag-rule';

const labelColumnPrefix = `$label$`;
const localStorageStateKey = `boomadminState`;
const localStorageStateVersion = `_v1`;

interface AppState {
  dbSchema: DbSchema;
  selectedRow: {[column: string]: any};
  selectedRowRefCountPromise: InspectablePromise<CountForeignReferencesResult>;
  tableDataPromise: InspectablePromise<TableProps>;
  urlState: UrlState;
  paneWidths: {
    navPane: number;
    detailPane: number;
  };
  paneVisibilities: {
    navPane: boolean;
    detailPane: boolean;
    sqlBuilder: boolean;
  };
}

class App extends Component<{}, AppState> {
  state: AppState = {
    dbSchema: null,
    selectedRow: null,
    selectedRowRefCountPromise: null,
    tableDataPromise: null,
    urlState: null,
    paneWidths: {
      navPane: 300,
      detailPane: 400,
    },
    paneVisibilities: {
      navPane: true,
      detailPane: false,
      sqlBuilder: false,
    },
  };

  update(updateObj: Partial<AppState>) {
    // so we get synchronous update behaviour. Why preact why? old behaviour was good
    // see https://preactjs.com/guide/v10/upgrade-guide/#dont-access-thisstate-synchronously
    this.setState(updateObj);
    Object.assign(this.state, updateObj);
  }

  async componentDidMount() {
    // default url hash is schema view
    const urlState = parseUrlState(location.href);
    if (!urlState.selectQuery) {
      urlState.selectQuery = {from: SchemaTable};
      setLocationHash({selectQuery: urlState.selectQuery});
    }

    this.update({urlState});
    this.restorePanesStateFromLocalStorage();

    const dbSchema = await getDbSchema();
    this.update({dbSchema});
    this.update({tableDataPromise: InspectablePromise.from(this.loadTableRowsNCols(), () => this.update({}))});
    window.addEventListener(`hashchange`, this.handleWindowHashChange);
    document.body.addEventListener(`click`, this.handleBodyClick);
  }

  componentWillUnmount() {
    window.removeEventListener(`hashchange`, this.handleWindowHashChange);
    document.body.removeEventListener(`click`, this.handleBodyClick);
  }

  handleWindowHashChange = (ev: HashChangeEvent) => {
    const oldUrlState = parseUrlState(ev.oldURL);
    const newUrlState = parseUrlState(ev.newURL);

    // reload table when url state changes
    if (JSON.stringify(oldUrlState) !== JSON.stringify(newUrlState)) {
      this.update({urlState: newUrlState, selectedRow: null});
      this.update({tableDataPromise: InspectablePromise.from(this.loadTableRowsNCols(), () => this.update({}))});
    }
  };

  handleBodyClick = (ev: MouseEvent) => {
    const target = ev.target as HTMLAnchorElement;
    if (!target.href) {
      return;
    }

    // TODO: handle better breadcrumbs later
    // const closestComponent = target.closest(`.Table,.ObjectEditor`);
    // console.info(`clicked link`, target.href);
  };

  handleTableRowSelect = (selectedRow: any) => {
    const {dbSchema, urlState} = this.state;
    const {selectQuery} = urlState;
    const tableName = selectQuery.from;
    const tableSchema = dbSchema.tables[tableName];

    if (tableSchema) {
      const primaryColumnName = tableSchema.primaryColumnName as string;
      const selectedRowRefCountPromise = InspectablePromise.from(
        countForeignReferences({
          tableName,
          rowId: selectedRow[primaryColumnName],
          columnName: primaryColumnName,
        }),
        () => this.update({}), // re-render when references count is loaded
      );

      this.update({
        selectedRow,
        selectedRowRefCountPromise,
      });
    } else {
      this.update({selectedRow: null, selectedRowRefCountPromise: null});
    }
  };

  handleTableColumnSelect = (column: TableColumn<any>) => {
    const selectQuery = this.state.urlState.selectQuery;
    const orderByField = selectQuery.orderBy?.[0];

    // toggle existing sort order field if present
    if (orderByField && orderByField.field === column.label) {
      orderByField.order = orderByField.order === `asc` ? `desc` : `asc`;
    } else {
      selectQuery.orderBy = [{field: column.label, order: `asc`}];
    }

    this.handleSelectQueryChange(selectQuery);
  };

  handleSelectQueryChange = (selectQuery: SelectQuery) => {
    console.info(`select query change`, selectQuery);
    setLocationHash({selectQuery});
  };

  handlePaneWidthChange = (width: number, paneName: keyof AppState['paneWidths']) => {
    const {paneWidths} = this.state;
    paneWidths[paneName] = width;
    this.update({paneWidths});
    this.persistPanesStateToLocalStorage();
  };

  handlePaneVisibilityChange = (visible: boolean, paneName: keyof AppState['paneVisibilities']) => {
    const {paneVisibilities} = this.state;
    paneVisibilities[paneName] = visible;
    this.update({paneVisibilities});
    this.persistPanesStateToLocalStorage();
  };

  persistPanesStateToLocalStorage() {
    const {paneVisibilities, paneWidths} = this.state;
    const storageKey = localStorageStateKey + localStorageStateVersion;
    window.localStorage.setItem(storageKey, JSON.stringify({paneVisibilities, paneWidths}));
  }

  restorePanesStateFromLocalStorage() {
    try {
      const storageKey = localStorageStateKey + localStorageStateVersion;
      const {paneWidths, paneVisibilities} = JSON.parse(localStorage.getItem(storageKey));
      this.update({paneWidths, paneVisibilities});
    } catch (err) {
      // fail gracefully if localstorage fails to load
    }
  }

  // TODO: move this to a helper delegate module
  async loadTableRowsNCols(): Promise<TableProps> {
    const {dbSchema, urlState} = this.state;
    const {selectQuery} = urlState;
    const tableName = selectQuery.from;

    if (tableName === SchemaTable) {
      return {
        rows: Object.values(dbSchema.tables),
        columns: [
          {label: `Name`, valueFn: (row) => row.tableName, hrefFn: ({tableName}) => makeHref({tableName})},
          {label: `Est. Num Rows`, valueFn: (row) => row.meta.numRows.toLocaleString()},
          {label: `Total Bytes`, valueFn: (row) => row.meta.numTotalBytes.toLocaleString()},
        ] as Array<TableColumn<DbTable>>,
      };
    } else {
      console.info(`loading table`, selectQuery);
      // TODO: make server send column info even if there are no rows
      const rows = await selectFromTable(selectQuery);
      let columns: Array<TableColumn<any>> = [];
      if (rows.length > 0) {
        columns = Object.keys(rows[0])
          .filter((columnName) => !columnName.startsWith(labelColumnPrefix))
          .map((columnName) => {
            const tableSchema = dbSchema.tables[tableName];
            const columnSchema = tableSchema.columns[columnName];
            const refersTo = columnSchema?.refersTo;
            return {
              label: columnName,
              valueFn: (row) => {
                // show id with foreign key label rather than a number (if available in row)
                const showIdWithFkLabel = false; // TODO: make as setting
                const fkLabel = row[labelColumnPrefix + columnName];
                let value = row[columnName];
                if (fkLabel) {
                  if (showIdWithFkLabel) {
                    value += ` (${fkLabel})`;
                  } else {
                    value = fkLabel;
                  }
                } else {
                  value = jsonStringifyIfPojo(value);
                }
                return value;
              },
              hrefFn: refersTo
                ? (row) =>
                    makeHref({
                      tableName: refersTo.destTableName,
                      columnName: refersTo.destColumnName,
                      value: row[columnName],
                    })
                : null,
            } as TableColumn<any>;
          });
      }
      return {rows, columns};
    }
  }

  render() {
    const {
      dbSchema,
      urlState,
      tableDataPromise,
      selectedRow,
      selectedRowRefCountPromise,
      paneWidths,
      paneVisibilities,
    } = this.state;
    const selectQuery = urlState?.selectQuery;
    const selectedTableName = selectQuery?.from;
    const canRender = dbSchema && selectedTableName;

    return canRender ? (
      <div class={styles.app}>
        <div class={styles.headerBar}>
          <div class={styles.headerBarBreadcrumb}>
            <NavBreadcrumb
              items={[{from: SchemaTable}, selectQuery.from !== SchemaTable ? selectQuery : null].filter(Boolean).map(
                (query) =>
                  ({
                    label:
                      query.from === SchemaTable
                        ? dbSchema.name
                        : `${query.from}${
                            query.where
                              ? `(${query.where.map((where) => `${where.field} ${where.op} ${where.value}`)})`
                              : ``
                          }`,
                    href: makeHref({tableName: query.from}),
                  } as BreadcrumbItem),
              )}
            />
          </div>
          <div class={styles.headerBarActions}>
            <input
              type={`checkbox`}
              checked={paneVisibilities.navPane}
              onChange={(ev) => this.handlePaneVisibilityChange(ev.currentTarget.checked, `navPane`)}
            />
            <span class={styles.headerBarActionLabel}>Nav Pane</span>
            <input
              type={`checkbox`}
              checked={paneVisibilities.detailPane}
              onChange={(ev) => this.handlePaneVisibilityChange(ev.currentTarget.checked, `detailPane`)}
            />
            <span class={styles.headerBarActionLabel}>Details Pane</span>
            <input
              type={`checkbox`}
              checked={paneVisibilities.sqlBuilder}
              onChange={(ev) => this.handlePaneVisibilityChange(ev.currentTarget.checked, `sqlBuilder`)}
            />
            <span class={styles.headerBarActionLabel}>SQL Builder</span>
          </div>
        </div>
        <div class={styles.bodyPanes}>
          {paneVisibilities.navPane ? (
            <div class={styles.navPane} style={{flex: `0 0 ${paneWidths.navPane}px`}}>
              <ItemList
                items={Object.keys(dbSchema.tables).map(
                  (tableName) =>
                    ({
                      label: tableName,
                      selected: tableName === selectedTableName,
                      href: makeHref({tableName}),
                    } as ItemListItem),
                )}
              />
              <DragRule
                position={DragRulePosition.Right}
                minValue={100}
                curValue={paneWidths.navPane}
                onValueChange={(width) => this.handlePaneWidthChange(width, `navPane`)}
              />
            </div>
          ) : null}
          <div class={styles.mainPane}>
            {selectedTableName !== SchemaTable ? (
              <div class={styles.queryPanel}>
                {paneVisibilities.sqlBuilder ? (
                  <ClauseBuilder
                    value={selectQuery}
                    schema={sqlSelectSchemaFromDbSchema(dbSchema)}
                    onValueChange={this.handleSelectQueryChange}
                  />
                ) : null}
              </div>
            ) : null}
            <div class={styles.tablePanel}>
              {tableDataPromise && tableDataPromise.hasValue() ? (
                <Table
                  {...tableDataPromise.value}
                  onRowSelect={this.handleTableRowSelect}
                  onColumnSelect={this.handleTableColumnSelect}
                />
              ) : null}
            </div>
            <div class={styles.statusPanel}>
              {!tableDataPromise || tableDataPromise.isPending() ? (
                `Loading ....`
              ) : tableDataPromise.hasError() ? (
                <div class={styles.errorPre}>{`Oh no! something went wrong :(\n${tableDataPromise.error}`}</div>
              ) : (
                `Loaded ${tableDataPromise.value.rows?.length} rows in ${tableDataPromise.timeToLoadMs}ms`
              )}
            </div>
          </div>
          {paneVisibilities.detailPane ? (
            <div class={styles.detailPane} style={{flex: `0 0 ${paneWidths.detailPane}px`}}>
              {selectedRow ? (
                <ObjectEditor
                  labelColumnPrefix={labelColumnPrefix}
                  columns={Object.values(dbSchema.tables[selectedTableName].columns)}
                  row={selectedRow}
                  referencedBy={dbSchema.tables[selectedTableName].referencedBy}
                  referencesCount={selectedRowRefCountPromise}
                />
              ) : (
                `Select a row to see details`
              )}
              <DragRule
                position={DragRulePosition.Left}
                curValue={paneWidths.detailPane}
                minValue={100}
                onValueChange={(width) => this.handlePaneWidthChange(width, `detailPane`)}
              />
            </div>
          ) : null}
        </div>
      </div>
    ) : (
      <div>Loading ...</div>
    );
  }
}

// because the script tag is defer-ed, the dom nodes will always be available before js executes
render(<App />, document.body);
