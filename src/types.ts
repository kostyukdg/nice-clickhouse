export type SqlTypeName = string;

export type SqlType = () => SqlTypeName;

export function Nullable(type: SqlType): SqlType {
  return () => `Nullable(${type()})`;
}

export function String(): ReturnType<SqlType> {
  return 'String';
}

export function UInt32(): ReturnType<SqlType> {
  return 'UInt32';
}

export function UInt8(): ReturnType<SqlType> {
  return 'UInt8';
}

export function UInt16(): ReturnType<SqlType> {
  return 'UInt16';
}

export function DateTime(): ReturnType<SqlType> {
  return 'DateTime';
}

export function Boolean(): ReturnType<SqlType> {
  return 'Boolean';
}

export function Decimal(precision: number, scale: number): SqlType {
  return () => `Decimal(${precision},${scale})`;
}
