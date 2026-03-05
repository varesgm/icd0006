import type { Task } from './types/task';
import type { ValidationResult, FieldErrors, ValidationRule, ValidationRules } from './types/validation';

/**
 * Input Validation Module for Task Manager
 * Provides comprehensive validation for task data with TypeScript strict typing.
 */
export class TaskValidator {
  readonly rules: ValidationRules;

  constructor() {
    this.rules = {
      title: {
        required: true,
        minLength: 1,
        maxLength: 200,
        pattern: /^[\w\s\-_.',!?()[\]{}:;]+$/u,
      },
      description: {
        required: false,
        maxLength: 2000,
        pattern: /^[\w\s\-_.',!?()[\]{}:;\n\r]*$/u,
      },
      status: {
        required: true,
        allowedValues: ['pending', 'in-progress', 'done', 'cancelled'],
      },
      priority: {
        required: true,
        allowedValues: ['low', 'medium', 'high', 'critical'],
      },
      dueDate: {
        required: false,
        validate: (value: unknown): boolean => {
          if (!value) return true;
          const date = new Date(value as string);
          if (isNaN(date.getTime())) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
      },
      tags: {
        required: false,
        validate: (value: unknown): boolean => {
          if (!Array.isArray(value)) return false;
          return value.every(
            (tag: unknown) =>
              typeof tag === 'string' &&
              tag.length <= 50 &&
              /^[\w\s\-_.]+$/u.test(tag)
          );
        },
      },
    };
  }

  validateTask(task: Partial<Task>): ValidationResult {
    const errors: FieldErrors = {};

    for (const [field, rules] of Object.entries(this.rules)) {
      const value = (task as Record<string, unknown>)[field];
      const fieldErrors = this.validateField(field, value, rules);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  validateField(fieldName: string, value: unknown, rules: ValidationRule): string[] {
    const errors: string[] = [];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${this.formatFieldName(fieldName)} is required`);
      return errors;
    }

    // Skip further validation if value is empty and not required
    if (!value && !rules.required) {
      return errors;
    }

    const strValue = value as string;

    // Min length check
    if (rules.minLength !== undefined && typeof value === 'string' && strValue.length < rules.minLength) {
      errors.push(`${this.formatFieldName(fieldName)} must be at least ${rules.minLength} characters`);
    }

    // Max length check
    if (rules.maxLength !== undefined && typeof value === 'string' && strValue.length > rules.maxLength) {
      errors.push(`${this.formatFieldName(fieldName)} must not exceed ${rules.maxLength} characters`);
    }

    // Pattern check
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(strValue)) {
      errors.push(`${this.formatFieldName(fieldName)} contains invalid characters`);
    }

    // Allowed values check
    if (rules.allowedValues && !rules.allowedValues.includes(strValue)) {
      errors.push(`${this.formatFieldName(fieldName)} must be one of: ${rules.allowedValues.join(', ')}`);
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      if (fieldName === 'dueDate') {
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          errors.push('Due date has an invalid format');
        } else {
          errors.push('Due date must be today or in the future');
        }
      } else {
        errors.push(`${this.formatFieldName(fieldName)} is invalid`);
      }
    }

    return errors;
  }

  sanitizeString(input: unknown): string {
    if (typeof input !== 'string') return '';

    let sanitized = input.trim();

    sanitized = sanitized
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    return sanitized;
  }

  sanitizeTags(tags: unknown[]): string[] {
    if (!Array.isArray(tags)) return [];

    return tags
      .map(tag => this.sanitizeString(tag).toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, self) => self.indexOf(tag) === index);
  }

  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }
}
