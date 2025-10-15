/**
 * Centralized validation system for API entities
 * Provides consistent validation rules across all modules
 * 
 * Features:
 * - Partial validation support for update operations
 * - Reusable validation rules for different field types
 * - Consistent error messaging in Spanish
 * - Support for both create (strict) and update (partial) operations
 */

/**
 * Common validation rules for different data types
 * These rules can be reused across different entity validators
 */
const ValidationRules = {
  // Email format validation using regex pattern
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Formato de email inválido';
  },

  // String length validations
  minLength: (min) => (value) => {
    return value.length >= min || `Debe tener al menos ${min} caracteres`;
  },

  maxLength: (max) => (value) => {
    return value.length <= max || `No puede exceder ${max} caracteres`;
  },

  // Data type validations
  isString: (value) => {
    return typeof value === 'string' || 'Debe ser un texto';
  },

  isNumber: (value) => {
    return !isNaN(value) || 'Debe ser un número';
  },

  isInteger: (value) => {
    return Number.isInteger(Number(value)) || 'Debe ser un número entero';
  },

  // Content format validations
  onlyAlphanumeric: (value) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return regex.test(value) || 'Solo se permiten letras, números y espacios';
  },

  onlyNumbers: (value) => {
    const regex = /^[0-9\s]+$/;
    return regex.test(value) || 'Solo se permiten números';
  },

  // Entity status validation (common across all entities)
  validStatus: (value) => {
    const validStatuses = ['active', 'inactive'];
    return validStatuses.includes(value) || 'El estado debe ser "active" o "inactive"';
  },

  // Required field validation (skipped in partial mode)
  required: (value) => {
    return (value !== undefined && value !== null && value !== '') || 'Este campo es obligatorio';
  }
};

/**
 * Field validator class for building validation chains
 * Allows chaining multiple validation rules for a single field
 * Supports conditional validation for partial validation mode
 */
class FieldValidator {
  constructor(fieldName, value) {
    this.fieldName = fieldName;
    this.value = value;
    this.rules = [];
    this.errors = [];
  }

  // Mark field as required (only enforced in non-partial mode)
  required() {
    this.rules.push(ValidationRules.required);
    return this;
  }

  // Email format validation
  email() {
    this.rules.push(ValidationRules.email);
    return this;
  }

  // Minimum length validation
  minLength(min) {
    this.rules.push(ValidationRules.minLength(min));
    return this;
  }

  // Maximum length validation
  maxLength(max) {
    this.rules.push(ValidationRules.maxLength(max));
    return this;
  }

  // Data type validations
  string() {
    this.rules.push(ValidationRules.isString);
    return this;
  }

  number() {
    this.rules.push(ValidationRules.isNumber);
    return this;
  }

  integer() {
    this.rules.push(ValidationRules.isInteger);
    return this;
  }

  // Content format validations
  alphanumeric() {
    this.rules.push(ValidationRules.onlyAlphanumeric);
    return this;
  }

  numbersOnly() {
    this.rules.push(ValidationRules.onlyNumbers);
    return this;
  }

  // Status validation for entities
  validStatus() {
    this.rules.push(ValidationRules.validStatus);
    return this;
  }

  // Custom validation rule
  custom(rule) {
    this.rules.push(rule);
    return this;
  }

  // Execute all validation rules for this field
  validate() {
    this.errors = [];
    
    for (const rule of this.rules) {
      const result = rule(this.value);
      if (result !== true) {
        this.errors.push(`${this.fieldName}: ${result}`);
      }
    }

    return this.errors;
  }
}

/**
 * Main validator class for coordinating field validations
 * Supports partial validation mode for update operations
 */
class Validator {
  constructor() {
    this.fields = [];
    this.allErrors = [];
  }

  // Add a field to validate with chained validation rules
  field(name, value) {
    const fieldValidator = new FieldValidator(name, value);
    this.fields.push(fieldValidator);
    return fieldValidator;
  }

  // Execute validation for all fields and return summary
  validate() {
    this.allErrors = [];
    
    for (const field of this.fields) {
      const fieldErrors = field.validate();
      this.allErrors.push(...fieldErrors);
    }

    return {
      isValid: this.allErrors.length === 0,
      errors: this.allErrors
    };
  }

  // Factory method for creating new validator instances
  static create() {
    return new Validator();
  }
}

/**
 * Entity-specific validators with partial validation support
 * Each validator can operate in two modes:
 * - Full mode (partial: false): All required fields must be present and valid
 * - Partial mode (partial: true): Only provided fields are validated, required checks skipped
 */
const EntityValidators = {
  /**
   * Headquarters entity validator
   * @param {Object} data - The headquarters data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  headquarters: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    // In partial mode (update), only validate fields that are present
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };
    
    // Name validation - required in create mode, optional in update mode
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().maxLength(150);
    }
      
    // Schedule validation
    if (shouldValidateField(data.schedule)) {
      const scheduleValidator = validator.field('schedule', data.schedule);
      if (!options.partial) scheduleValidator.required();
      scheduleValidator.string().maxLength(300);
    }
      
    // Location validation
    if (shouldValidateField(data.location)) {
      const locationValidator = validator.field('location', data.location);
      if (!options.partial) locationValidator.required();
      locationValidator.string().maxLength(300);
    }
      
    // Email validation with format checking
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().email().maxLength(150);
    }
      
    // Description validation
    if (shouldValidateField(data.description)) {
      const descriptionValidator = validator.field('description', data.description);
      if (!options.partial) descriptionValidator.required();
      descriptionValidator.string().maxLength(750);
    }
      
    // Status validation (active/inactive)
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * User entity validator
   * @param {Object} data - The user data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  user: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };
    
    // Email validation
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().email();
    }
    
    // Name validation
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().maxLength(100);
    }
    
    // Password validation (usually required only on create)
    if (shouldValidateField(data.password)) {
      const passwordValidator = validator.field('password', data.password);
      if (!options.partial) passwordValidator.required();
      passwordValidator.string().minLength(6);
    }
    
    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Category entity validator
   * @param {Object} data - The category data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  category: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };
    
    // Category name validation
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().alphanumeric().maxLength(150);
    }
    
    // Status validation
    if (shouldValidateField(data.status)) {
      const statusValidator = validator.field('status', data.status);
      if (!options.partial) statusValidator.required();
      statusValidator.validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Role entity validator
   * @param {Object} data - The role data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  role: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };
    
    // Role name validation
    if (shouldValidateField(data.rolName)) {
      const nameValidator = validator.field('roleName', data.rolName);
      if (!options.partial) nameValidator.required();
      nameValidator.string().alphanumeric().maxLength(100);
    }
    
    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  }
};

// Export the validation system components
module.exports = {
  Validator,           // Main validator class for building custom validations
  ValidationRules,     // Individual validation rule functions
  EntityValidators     // Pre-configured validators for specific entities
};