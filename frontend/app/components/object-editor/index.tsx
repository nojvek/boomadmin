import {h, Component} from 'preact';
import cx from 'classnames';
import {jsonStringifyIfPojo} from 'common/util/pojo';
import {DbForeignKeyRef, DbTableColumn} from 'common/api/db-schema';
import {CountForeignReferencesResult} from 'common/api/api-types';
import {makeHref} from '../../util/url-state';
import styles from './index.jss';
import commonStyles from '../../util/jss/common-styles.jss';
import {InspectablePromise} from '../../util/inspectable-promise';

export const enum FieldType {
  Text = `text`,
  Number = `number`,
  Json = `json`,
  Date = `date`,
  Boolean = `boolean`,
}

export interface ObjectEditorProps {
  labelColumnPrefix: string;
  columns: DbTableColumn[];
  row: {[column: string]: any};
  referencedBy?: DbForeignKeyRef[];
  referencesCount?: InspectablePromise<CountForeignReferencesResult>;
}

interface ObjectEditorState {
  searchFilter?: string;
}

export class ObjectEditor extends Component<ObjectEditorProps, ObjectEditorState> {
  render() {
    const {columns, referencedBy, row, labelColumnPrefix, referencesCount} = this.props;

    return (
      <div class={cx(`ObjectEditor`, styles.objectEditor)}>
        <div class={styles.fieldsView}>
          {columns.map((col) => {
            let value = row[col.columnName];
            const href = col.refersTo
              ? makeHref({
                  tableName: col.refersTo.destTableName,
                  columnName: col.refersTo.destColumnName,
                  value: row[col.columnName],
                })
              : null;
            const hrefLabel = row[labelColumnPrefix + col.columnName] || null;

            // convert json like strings to json
            if (value && !col.refersTo && typeof value === `string` && value.startsWith(`{"`)) {
              try {
                value = JSON.parse(value);
              } catch (err) {
                // not json, do nothing
              }
            }

            return (
              <div class={styles.fieldWrapper}>
                <div class={styles.fieldName}>{col.columnName}</div>
                {col.refersTo ? (
                  <a class={commonStyles.aLink} href={href}>
                    {value}
                    {hrefLabel ? ` (${hrefLabel})` : ``}
                  </a>
                ) : (
                  <div class={styles.fieldValue}>{jsonStringifyIfPojo(value, true) || `<empty>`}</div>
                )}
              </div>
            );
          })}
        </div>
        <div class={styles.referencesView}>
          <div class={styles.viewTitle}>Referenced By</div>
          {referencedBy
            ? referencedBy
                .sort((a, b) => a.destTableName.localeCompare(b.destTableName))
                .map((ref) => {
                  let refCount: string | number = `...`;
                  if (referencesCount.hasValue()) {
                    refCount = referencesCount.value[`${ref.destTableName}.${ref.destColumnName}`];
                  }

                  return (
                    <div>
                      <a
                        class={styles.fkReference}
                        href={makeHref({
                          tableName: ref.destTableName,
                          columnName: ref.destColumnName,
                          value: row[ref.srcColumnName],
                        })}
                      >
                        {`${ref.destTableName} (${refCount})`}
                      </a>
                    </div>
                  );
                })
            : null}
        </div>
      </div>
    );
  }
}
