export type SqlTypeName = string;

export type SqlType = () => SqlTypeName;

export function Nullable(type: SqlType): SqlType {
  return () => `Nullable(${type()})`;
}

export function String(): ReturnType<SqlType> {
  return 'String';
}

export function Int8(): ReturnType<SqlType> {
  return 'Int8';
}

export function Int16(): ReturnType<SqlType> {
  return 'Int16';
}

export function Int32(): ReturnType<SqlType> {
  return 'Int32';
}

export function Int64(): ReturnType<SqlType> {
  return 'Int64';
}

export function Int128(): ReturnType<SqlType> {
  return 'Int128';
}

export function Int256(): ReturnType<SqlType> {
  return 'Int256';
}

export function UInt8(): ReturnType<SqlType> {
  return 'UInt8';
}

export function UInt16(): ReturnType<SqlType> {
  return 'UInt16';
}

export function UInt32(): ReturnType<SqlType> {
  return 'UInt32';
}

export function UInt64(): ReturnType<SqlType> {
  return 'UInt64';
}

export function UInt128(): ReturnType<SqlType> {
  return 'UInt128';
}

export function UInt256(): ReturnType<SqlType> {
  return 'UInt256';
}

export function Float32(): ReturnType<SqlType> {
  return 'Float32';
}

export function Float64(): ReturnType<SqlType> {
  return 'Float64';
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
