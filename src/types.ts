type SqlTypeName =
  | 'UInt32'
  | 'UInt8'
  | 'UInt16'
  | 'Decimal'
  | 'DateTime'
  | 'Boolean'
  | 'String';

export interface SqlType {
  type: SqlTypeName;
  format?: (value: unknown) => string;
}

export function String(): SqlType {
  return { type: 'String' };
}

export function UInt32(): SqlType {
  return { type: 'UInt32' };
}

export function UInt8(): SqlType {
  return { type: 'UInt8' };
}

export function UInt16(): SqlType {
  return { type: 'UInt16' };
}

export function DateTime(): SqlType {
  return { type: 'DateTime' };
}

export function Boolean(): SqlType {
  return { type: 'Boolean' };
}

export function Decimal(): SqlType {
  return { type: 'Decimal' };
}
