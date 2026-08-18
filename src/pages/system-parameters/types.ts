export type InputType =
  'address' | 'uint' | 'uint32' | 'uint16' | 'bool' | 'bps';

export interface SettingConfig {
  label: string;
  description?: string;
  inputType: InputType;
  placeholder?: string;
  unit?: string;
}
