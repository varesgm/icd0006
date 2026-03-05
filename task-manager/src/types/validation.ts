export interface ValidationResult {
  isValid: boolean;
  errors: FieldErrors;
}

export type FieldErrors = Record<string, string[]>;

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: string[];
  validate?: (value: unknown) => boolean;
}

export type ValidationRules = Record<string, ValidationRule>;
