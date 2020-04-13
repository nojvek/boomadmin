export interface WhereFilter {
  field: string;
  op: string;
  value?: string;
}

export interface OrderByField {
  field?: string;
  order?: string; // asc | desc
}

export interface Aggregate {
  math: string;
  on?: string;
  groupBy: string[];
}

export interface SelectQuery {
  from: string;
  select?: string[];
  where?: WhereFilter[];
  aggregate?: Aggregate;
  orderBy?: OrderByField[];
  limit?: number;
}
