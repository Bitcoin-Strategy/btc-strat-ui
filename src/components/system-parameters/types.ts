export type InputType =
  | 'address'
  | 'uint'
  | 'uint32'
  | 'uint16'
  | 'bool'
  | 'bps'
  | 'select'
  | 'checkbox'
  | 'datetime';

/** Read from the contract: several limits are per-deployment immutables. Same units as `writeTransform`. */
export interface FieldBound {
  fn: string;
  kind: 'max' | 'min';
}

export interface FieldPresentation {
  /** Unit shown inside the field. */
  unit?: string;
  bound?: FieldBound;
  preview?: (raw: any) => string;
  /** The field has no current value to read. */
  writeOnly?: boolean;
}

export interface SettingConfig extends FieldPresentation {
  label: string;
  description?: string;
  inputType: InputType;
  placeholder?: string;
}
