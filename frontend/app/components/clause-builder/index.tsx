import {h, Component, Fragment, JSX} from 'preact';
import cx from 'classnames';
import styles from './index.jss';

// Value builder schema based on json-schema
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/json-schema/index.d.ts
// this means this component can build a fantastic UI for any json like value

export const enum ValueType {
  String = `string`,
  Number = `number`,
  Boolean = `boolean`,
  Object = `object`,
  Array = `array`,
}

export type Obj<ValT> = {[prop: string]: ValT};
export type ValueSchema = StringSchema | NumberSchema | BooleanSchema | ObjectSchema | ArraySchema;

export interface BaseSchema<DefaultType> {
  title?: string;
  description?: string;
  required?: boolean;
  default?: DefaultType;
}

export interface ObjectSchema extends BaseSchema<Obj<any>> {
  type: ValueType.Object;
  properties: Obj<ValueSchema>;
}

export interface ArraySchema extends BaseSchema<any[]> {
  type: ValueType.Array;
  items: ValueSchema;
}

export interface StringSchema extends BaseSchema<string> {
  type: ValueType.String;
  enum?: string[] | ((valueAncestry: ValueAncestry<string, StringSchema>) => string[]);
  pattern?: string;
}

export interface NumberSchema extends BaseSchema<number> {
  type: ValueType.Number;
}

export interface BooleanSchema extends BaseSchema<boolean> {
  type: ValueType.Boolean;
}

export interface ValueAncestryPart<ValueT = any, SchemaT = ValueSchema> {
  /** key=null for root value (the last ancestry part) */
  key: string | number | null;
  value: ValueT;
  schema: SchemaT;
}

export type ValueAncestry<ValueT = any, SchemaT = ValueSchema> = [
  ValueAncestryPart<ValueT, SchemaT>,
  ...Array<ValueAncestryPart<any, ValueSchema>>,
];

// ---- Value Views ----

interface ViewProps<ValueT, SchemaT> {
  valueAncestry: ValueAncestry<ValueT, SchemaT>;
  onValueChange: (newValue: ValueT) => void;
}

function createEmptyValue(schema: ValueSchema, valueAncestry: ValueAncestry): any {
  // TODO: valueAncestry isn't properly piped (key paths may be incorrect)
  if (schema.type === ValueType.String) {
    let value = schema.default || ``;
    if (!value && schema.enum) {
      if (Array.isArray(schema.enum) && schema.enum.length > 0) {
        value = schema.enum[0];
      } else if (typeof schema.enum === `function`) {
        const options = schema.enum(valueAncestry as ValueAncestry<string, StringSchema>);
        if (options.length > 0) {
          value = options[0];
        }
      }
    }
    return value;
  } else if (schema.type === ValueType.Boolean) {
    return schema.default || false;
  } else if (schema.type === ValueType.Number) {
    return schema.default || 0;
  } else if (schema.type === ValueType.Array) {
    return [];
  } else if (schema.type === ValueType.Object) {
    const value: Obj<any> = {};
    Object.entries(schema.properties)
      .filter(([_prop, propSchema]) => propSchema.required)
      .forEach(([prop, propSchema]) => {
        value[prop] = createEmptyValue(propSchema, valueAncestry);
      });
    return value;
  }
  return null;
}

function Removable({
  removable = true,
  onRemove,
  children,
}: {
  removable?: boolean;
  onRemove: (ev: MouseEvent) => void;
  children?: JSX.Element;
}) {
  return (
    <div class={styles.removable}>
      {removable ? <div class={styles.xBtn} onClick={onRemove}>{`✕`}</div> : null}
      {children}
    </div>
  );
}

function StringView({valueAncestry, onValueChange}: ViewProps<string, StringSchema>) {
  const {value, schema} = valueAncestry[0];
  if (schema.enum) {
    let options: string[];
    if (typeof schema.enum === `function`) {
      options = schema.enum(valueAncestry);
    } else {
      options = schema.enum;
    }

    if (!options.includes(value)) {
      // so that empty val shows up as label
      // TODO: remove when we have our own nicer select
      options.push(value);
    }

    const handleSelectChange = (ev: Event) => {
      const selectedOption = options[(ev.target as HTMLSelectElement).selectedIndex];
      onValueChange(selectedOption);
    };
    return (
      <select onChange={handleSelectChange}>
        {options.map((option) => (
          <option selected={option === value}>{option}</option>
        ))}
      </select>
    );
  } else {
    const handleInputChange = (ev: Event) => onValueChange((ev.target as HTMLInputElement).value);
    return <input value={value} onChange={handleInputChange}></input>;
  }
}

function NumberView({valueAncestry, onValueChange}: ViewProps<number, NumberSchema>) {
  const {value} = valueAncestry[0];
  const handleInputChange = (ev: Event) => onValueChange(Number((ev.target as HTMLInputElement).value));
  return <input value={value} type={`number`} onChange={handleInputChange}></input>;
}

function BooleanView({valueAncestry, onValueChange}: ViewProps<boolean, BooleanSchema>) {
  const {value} = valueAncestry[0];
  const handleInputChange = (ev: Event) => onValueChange((ev.target as HTMLInputElement).checked);
  return <input checked={value} type={`checkbox`} onChange={handleInputChange}></input>;
}

function ObjectView({valueAncestry, onValueChange}: ViewProps<Obj<any>, ObjectSchema>) {
  const {value, schema} = valueAncestry[0];
  const propSchemas = schema.properties;
  const schemaPropNames = Object.keys(propSchemas);

  const handlePropValueChange = (propName: string, newValue: any) => {
    onValueChange({...value, [propName]: newValue});
  };

  const handleNewPropBtnClick = (propName: string) => {
    // ensure order of keys is preserved as per prop schema
    const newValue: Obj<any> = {};
    for (const prop of schemaPropNames) {
      if (Object.prototype.hasOwnProperty.call(value, prop)) {
        newValue[prop] = value[prop];
      } else if (propName === prop) {
        newValue[prop] = createEmptyValue(propSchemas[propName], valueAncestry);
      }
    }
    onValueChange(newValue);
  };

  const handleRemovePropBtnClick = (propName: string) => {
    const newValue = {...value};
    delete newValue[propName];
    onValueChange(newValue);
  };

  return (
    <div class={cx(styles.objectView, styles.borderBox)}>
      {schemaPropNames.map((propName) => {
        const propSchema = propSchemas[propName];
        const hasProp = Object.prototype.hasOwnProperty.call(value, propName);
        const propAncestry: ValueAncestry = [
          {key: propName, value: value[propName], schema: propSchemas[propName]},
          ...valueAncestry,
        ];
        return hasProp ? (
          <Fragment>
            <div class={styles.objectPropName}>
              <Removable removable={!propSchema.required} onRemove={() => handleRemovePropBtnClick(propName)}>
                <div>{propName}</div>
              </Removable>
            </div>
            <div>
              <ValueView
                valueAncestry={propAncestry}
                onValueChange={(newValue) => handlePropValueChange(propName, newValue)}
              />
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <button onClick={() => handleNewPropBtnClick(propName)}>{propName}</button>
            <div></div>
          </Fragment>
        );
      })}
    </div>
  );
}

function ArrayView({valueAncestry, onValueChange}: ViewProps<any[], ArraySchema>) {
  const {value, schema} = valueAncestry[0];
  const itemSchema = schema.items;

  const handleNewItemBtnClick = () => {
    const newValue = value.slice();
    newValue.push(createEmptyValue(itemSchema, valueAncestry));
    onValueChange(newValue);
  };

  const handleRemoveItemBtnClick = (idx: number) => {
    const newValue = value.slice();
    newValue.splice(idx, 1);
    onValueChange(newValue);
  };

  return (
    <div class={styles.borderBox}>
      {value.map((item, idx) => {
        const itemAncestry: ValueAncestry = [{key: idx, value: item, schema: itemSchema}, ...valueAncestry];
        const handleItemValueChange = (newValue: any) => {
          const valueCopy = value.slice();
          valueCopy[idx] = newValue;
          onValueChange(valueCopy);
        };
        return (
          <Removable onRemove={() => handleRemoveItemBtnClick(idx)}>
            <ValueView valueAncestry={itemAncestry} onValueChange={handleItemValueChange} />
          </Removable>
        );
      })}
      <button onClick={handleNewItemBtnClick}>+</button>
    </div>
  );
}

function ValueView({valueAncestry, onValueChange}: ViewProps<any, ValueSchema>) {
  const {value, schema} = valueAncestry[0];
  if (value === null) {
    return <span>null</span>;
  }

  return schema.type === ValueType.Object ? (
    <ObjectView valueAncestry={valueAncestry as ValueAncestry<Obj<any>, ObjectSchema>} onValueChange={onValueChange} />
  ) : schema.type === ValueType.Array ? (
    <ArrayView valueAncestry={valueAncestry as ValueAncestry<any[], ArraySchema>} onValueChange={onValueChange} />
  ) : schema.type === ValueType.String ? (
    <StringView valueAncestry={valueAncestry as ValueAncestry<string, StringSchema>} onValueChange={onValueChange} />
  ) : schema.type === ValueType.Number ? (
    <NumberView valueAncestry={valueAncestry as ValueAncestry<number, NumberSchema>} onValueChange={onValueChange} />
  ) : schema.type === ValueType.Boolean ? (
    <BooleanView valueAncestry={valueAncestry as ValueAncestry<boolean, BooleanSchema>} onValueChange={onValueChange} />
  ) : null; // TODO: implement others
}

// ---- Clause Builder ----

export interface ClauseBuilderProps<ValueT> {
  schema: ValueSchema;
  value?: ValueT;
  onValueChange?: (newValue: ValueT, oldValue?: ValueT) => void;
}

interface ClauseBuilderState {}

export class ClauseBuilder<ValueT> extends Component<ClauseBuilderProps<ValueT>, ClauseBuilderState> {
  state: ClauseBuilderState = {};

  render() {
    const {value, schema} = this.props;
    const valueAncestry: ValueAncestry<any, ValueSchema> = [{key: null, value, schema}];

    const handleValueChange = (newValue: ValueT) => {
      this.props?.onValueChange(newValue, value);
    };

    return (
      <div class={cx(`ClauseBuilder`, styles.clauseBuilder)}>
        <ValueView valueAncestry={valueAncestry} onValueChange={handleValueChange} />
      </div>
    );
  }
}
