import {ValueType, ValueSchema, ValueAncestry, StringSchema, ObjectSchema} from '../components/clause-builder';
import {DbSchema} from 'common/api/db-schema';
import {SelectQuery} from 'common/api/sql-types';

export function sqlSelectSchemaFromDbSchema(dbSchema: DbSchema): ValueSchema {
  const columnNamesEnumFn = (valueAncestry: ValueAncestry<string, StringSchema>) => {
    const rootValue = valueAncestry[valueAncestry.length - 1].value as SelectQuery;
    const fromTable = rootValue.from;
    const tableColumns = Object.keys(dbSchema.tables[fromTable].columns);
    return tableColumns;
  };

  const orderByField: ObjectSchema = {
    type: ValueType.Object,
    title: `OrderByField`,
    properties: {
      field: {
        type: ValueType.String,
        required: true,
        enum: columnNamesEnumFn,
      },
      order: {
        type: ValueType.String,
        required: true,
        default: `asc`,
        enum: [`asc`, `desc`],
      },
    },
  };

  const whereFilter: ObjectSchema = {
    type: ValueType.Object,
    title: `WhereFilter`,
    properties: {
      field: {
        type: ValueType.String,
        required: true,
        enum: columnNamesEnumFn,
      },
      op: {
        type: ValueType.String,
        required: true,
        default: `=`,
        enum: [`=`, `!=`, `like`, `>`, `<`, `is null`, `is not null`],
      },
      value: {
        type: ValueType.String,
        required: true,
      },
    },
  };

  const aggregate: ObjectSchema = {
    type: ValueType.Object,
    title: `AggregateClause`,
    properties: {
      math: {
        type: ValueType.String,
        required: true,
        enum: [`count`, `sum`, `avg`],
      },
      on: {
        type: ValueType.String,
        enum: columnNamesEnumFn,
      },
      groupBy: {
        type: ValueType.Array,
        required: true,
        items: {
          type: ValueType.String,
          enum: columnNamesEnumFn,
        },
      },
    },
  };

  const selectQuery: ObjectSchema = {
    type: ValueType.Object,
    title: `SelectQuery`,
    properties: {
      from: {
        type: ValueType.String,
        enum: Object.keys(dbSchema.tables),
        required: true,
      },
      select: {
        type: ValueType.Array,
        items: {
          type: ValueType.String,
          enum: columnNamesEnumFn,
        },
      },
      where: {
        type: ValueType.Array,
        items: whereFilter,
      },
      aggregate,
      orderBy: {
        type: ValueType.Array,
        items: orderByField,
      },
      limit: {
        type: ValueType.Number,
      },
    },
  };

  return selectQuery;
}
