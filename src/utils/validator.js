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
  // Hardcoded offset for timezone adjustment (6 hours)
  TIMEZONE_OFFSET_HOURS: 6,
  // Email format validation using regex pattern
  email: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Formato de email inválido';
  },

  // String length validations
  minLength: (min) => (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    return value.length >= min || `Debe tener al menos ${min} caracteres`;
  },

  maxLength: (max) => (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    return value.length <= max || `No puede exceder ${max} caracteres`;
  },

  // Data type validations
  isString: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    return typeof value === 'string' || 'Debe ser un texto';
  },

  isNumber: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    return !isNaN(value) || 'Debe ser un número';
  },

  isInteger: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    return Number.isInteger(Number(value)) || 'Debe ser un número entero';
  },

  // Strict integer validation - only accepts number type, not strings
  isStrictInteger: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    if (typeof value !== 'number') return 'Debe ser un número, no texto u otro tipo';
    return Number.isInteger(value) || 'Debe ser un número entero sin decimales';
  },

  // Content format validations
  onlyAlphanumeric: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    // Support for international characters including Spanish accents, ñ, and other languages
    const regex = /^[\p{L}\p{N}\s]+$/u;
    return regex.test(value) || 'Solo se permiten letras, números y espacios';
  },

  onlyNumbers: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    const regex = /^[0-9\s]+$/;
    return regex.test(value) || 'Solo se permiten números';
  },

  // International text validation (letters, numbers, spaces, punctuation, accents)
  internationalText: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    // Allows letters (any language), numbers, spaces, and common punctuation
    const regex = /^[\p{L}\p{N}\p{P}\p{Z}]+$/u;
    return regex.test(value) || 'Solo se permiten letras, números, espacios y signos de puntuación';
  },

  // Phone number validation (international format support)
  phoneNumber: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    // Allows numbers, spaces, hyphens, parentheses, and plus sign
    const regex = /^[\d\s\-()+ ]+$/;
    return regex.test(value) || 'Formato de teléfono inválido';
  },

  // Document/identifier validation (alphanumeric with hyphens)
  documentNumber: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    const regex = /^[\p{L}\p{N}\-]+$/u;
    return regex.test(value) || 'Solo se permiten letras, números y guiones';
  },

  // Country/Location validation (letters, numbers, spaces, accents, apostrophes, hyphens, commas)
  locationText: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    const regex = /^[\p{L}\p{N}\s'\-.,-]+$/u;
    return regex.test(value) || 'Solo se permiten letras, números, espacios, apostrofes, guiones, puntos y comas';
  },

  // Date validation with strict day/month checking
  // Parse a date value into a Date object treating plain date strings as local dates at midnight.
  // Supports: 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'DD/MM/YYYY', and Date objects.
  // Now also supports times: 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', etc., treated as local.
  parseDate: (value) => {
    if (value === undefined || value === null) return null;
    // If it's already a Date
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

    // If it's a number (timestamp)
    if (typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'string') {
      const s = value.trim();

      // Try ISO-like YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss (treat as local date/time, not UTC)
      const isoTimeMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
      if (isoTimeMatch) {
        const year = Number(isoTimeMatch[1]);
        const month = Number(isoTimeMatch[2]);
        const day = Number(isoTimeMatch[3]);
        const hour = isoTimeMatch[4] ? Number(isoTimeMatch[4]) : 0;
        const minute = isoTimeMatch[5] ? Number(isoTimeMatch[5]) : 0;
        const second = isoTimeMatch[6] ? Number(isoTimeMatch[6]) : 0;
        const d = new Date(year, month - 1, day, hour, minute, second);
        // Hardcoded timezone adjustment: subtract 6 hours if time was specified
        if (isoTimeMatch[4]) {
          d.setHours(d.getHours() - ValidationRules.TIMEZONE_OFFSET_HOURS);
        }
        return isNaN(d.getTime()) ? null : d;
      }

      // Try DD-MM-YYYY HH:mm:ss or DD/MM/YYYY HH:mm:ss
      const dmTimeMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
      if (dmTimeMatch) {
        const day = Number(dmTimeMatch[1]);
        const month = Number(dmTimeMatch[2]);
        const year = Number(dmTimeMatch[3]);
        const hour = dmTimeMatch[4] ? Number(dmTimeMatch[4]) : 0;
        const minute = dmTimeMatch[5] ? Number(dmTimeMatch[5]) : 0;
        const second = dmTimeMatch[6] ? Number(dmTimeMatch[6]) : 0;
        const d = new Date(year, month - 1, day, hour, minute, second);
        // Hardcoded timezone adjustment: subtract 6 hours if time was specified
        if (dmTimeMatch[4]) {
          d.setHours(d.getHours() - ValidationRules.TIMEZONE_OFFSET_HOURS);
        }
        return isNaN(d.getTime()) ? null : d;
      }

      // Fallback: let Date try parsing (may interpret timezone)
      const fallback = new Date(s);
      return isNaN(fallback.getTime()) ? null : fallback;
    }

    return null;
  },

  // Date validation with strict day/month checking
  isValidDate: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    
    // Use parseDate to reliably get a Date treated as local
    const date = ValidationRules.parseDate(value);
    if (!date) return 'La fecha debe incluir año, mes y día completos (ej: 2024-01-15, 2024-01-15T10:30:00 o 15/01/2024 10:30)';
    
    // For string inputs, validate the components (day, month, year, and optionally hour, minute, second)
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // Reject incomplete date formats (year only or year-month only)
      // Must have at least year, month, and day
      if (!/^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:\s\d{1,2}:\d{1,2}(?::\d{1,2})?)?$/.test(dateStr) && 
          !/^\d{1,2}[-/]\d{1,2}[-/]\d{4}(?:[T\s]\d{1,2}:\d{1,2}(?::\d{1,2})?)?$/.test(dateStr) &&
          !/^\d{4}[-/]\d{1,2}[-/]\d{1,2}T\d{1,2}:\d{1,2}(?::\d{1,2})?$/.test(dateStr)) {
        return 'La fecha debe incluir año, mes y día completos (ej: 2024-01-15, 2024-01-15T10:30:00 o 15/01/2024 10:30)';
      }
      
      let day, month, year, hour, minute, second, hasTime = false;
      
      // Try ISO format with optional time (YYYY-MM-DD or YYYY/MM/DD [T]HH:mm[:ss])
      const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
      if (isoMatch) {
        year = parseInt(isoMatch[1]);
        month = parseInt(isoMatch[2]);
        day = parseInt(isoMatch[3]);
        if (isoMatch[4]) {
          hour = parseInt(isoMatch[4]);
          minute = parseInt(isoMatch[5]);
          second = isoMatch[6] ? parseInt(isoMatch[6]) : 0;
          hasTime = true;
        }
      }
      // Try DD-MM-YYYY or DD/MM/YYYY with optional time
      else {
        const dmMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (dmMatch) {
          day = parseInt(dmMatch[1]);
          month = parseInt(dmMatch[2]);
          year = parseInt(dmMatch[3]);
          if (dmMatch[4]) {
            hour = parseInt(dmMatch[4]);
            minute = parseInt(dmMatch[5]);
            second = dmMatch[6] ? parseInt(dmMatch[6]) : 0;
            hasTime = true;
          }
        }
      }
      
      // Validate month is between 1-12
      if (month && (month < 1 || month > 12)) {
        return 'El mes debe estar entre 1 y 12';
      }
      
      // Validate day is valid for the given month/year
      if (day && month && year) {
        const maxDays = new Date(year, month, 0).getDate(); // Get max days in that month
        if (day < 1 || day > maxDays) {
          return `El día debe estar entre 1 y ${maxDays} para el mes especificado`;
        }
      }
      
      // Validate hour is between 0-23
      if (hasTime && (hour < 0 || hour > 23)) {
        return 'La hora debe estar entre 0 y 23';
      }
      
      // Validate minute is between 0-59
      if (hasTime && (minute < 0 || minute > 59)) {
        return 'Los minutos deben estar entre 0 y 59';
      }
      
      // Validate second is between 0-59
      if (hasTime && (second < 0 || second > 59)) {
        return 'Los segundos deben estar entre 0 y 59';
      }
      
      // Additional check: verify the parsed date matches the input
      // This catches cases like "2024-02-30" which JavaScript converts to "2024-03-01"
      if (day && month && year) {
        // Create reconstructed date with the timezone-adjusted time
        let adjustedHour = hasTime ? hour - ValidationRules.TIMEZONE_OFFSET_HOURS : 0;
        let adjustedMinute = hasTime ? minute : 0;
        let adjustedSecond = hasTime ? second : 0;
        let adjustedDay = day;
        let adjustedMonth = month;
        let adjustedYear = year;
        
        // Handle hour wrapping (negative hours wrap to previous day)
        if (hasTime && adjustedHour < 0) {
          adjustedHour += 24;
          // Subtract one day
          const tempDate = new Date(year, month - 1, day - 1);
          adjustedDay = tempDate.getDate();
          adjustedMonth = tempDate.getMonth() + 1;
          adjustedYear = tempDate.getFullYear();
        }
        
        const reconstructed = new Date(adjustedYear, adjustedMonth - 1, adjustedDay, adjustedHour, adjustedMinute, adjustedSecond);
        
        // The parsed date should match the reconstructed date
        const parsed = ValidationRules.parseDate(value);
        if (!parsed || 
            parsed.getDate() !== reconstructed.getDate() || 
            parsed.getMonth() !== reconstructed.getMonth() || 
            parsed.getFullYear() !== reconstructed.getFullYear() ||
            (hasTime && parsed.getHours() !== reconstructed.getHours()) ||
            (hasTime && parsed.getMinutes() !== reconstructed.getMinutes()) ||
            (hasTime && parsed.getSeconds() !== reconstructed.getSeconds())) {
          return 'Fecha u hora inválida para el mes especificado';
        }
      }
    }
    
    return true;
  },  // Date not in future validation (birthday, etc.)
  dateNotInFuture: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    
    // First validate it's a valid date
    const validDateResult = ValidationRules.isValidDate(value);
    if (validDateResult !== true) return validDateResult;

    const date = ValidationRules.parseDate(value);
    const now = new Date();
    return date <= now || 'La fecha no puede ser en el futuro';
  },

  // Positive number validation (for hours, quantities, etc.)
  positiveNumber: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    const num = Number(value);
    return num >= 0 || 'El valor debe ser mayor o igual a cero';
  },

  // Compare two dates: first date must be before second date
  dateBefore: (firstDate, secondDate, firstFieldName = 'Fecha de inicio', secondFieldName = 'Fecha de finalización') => {
    if (firstDate === undefined || firstDate === null || secondDate === undefined || secondDate === null) return true;
    const date1 = ValidationRules.parseDate(firstDate);
    const date2 = ValidationRules.parseDate(secondDate);

    if (!date1 || !date2) return `${firstFieldName} o ${secondFieldName} inválida(s)`;
    return date1 < date2 || `${firstFieldName} debe ser anterior a ${secondFieldName}`;
  },

  // Boolean validation
  isBoolean: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    return typeof value === 'boolean' || 'Debe ser "true" o "false"';
  },

  // Entity status validation (common across all entities)
  validStatus: (value) => {
    if (value === undefined || value === null) return true; // Skip if value is not provided
    const validStatuses = ['active', 'inactive'];
    return validStatuses.includes(value) || 'El estado debe ser "active" o "inactive"';
  },

  // Required field validation (skipped in partial mode)
  required: (value) => {
    if (value === undefined || value === null) return 'Este campo es obligatorio';
    if (typeof value === 'string') {
      return value.trim() !== '' || 'Este campo es obligatorio';
    }
    return true; // For non-string values, just check that they're not null/undefined
  },

  // ---- CONTROLLER HELPER FUNCTIONS ----
  
  /**
   * Trims all string fields in an object and normalizes multiple spaces to single space
   * Useful for cleaning user input before validation
   * Examples:
   * - "  alberto  " → "alberto"
   * - "alberto                gomes    gonzales            " → "alberto gomes gonzales"
   * @param {Object} data - The object with fields to trim
   * @returns {Object} New object with trimmed and normalized string values
   */
  trimStringFields: (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const trimmedData = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        // Only process if it's a string and not null/undefined
        if (typeof value === 'string') {
          // Trim leading/trailing spaces and replace multiple spaces with single space
          trimmedData[key] = value.trim().replace(/\s+/g, ' ');
        } else {
          trimmedData[key] = value;
        }
      }
    }
    return trimmedData;
  },
 
  parseIdParam: (id) => {
    if (!id || typeof id !== 'string') return null;
    const trimmed = id.trim();
    
    // Use existing ValidationRules
    const numbersOnlyResult = ValidationRules.onlyNumbers(trimmed);
    if (numbersOnlyResult !== true) return null;
    
    const n = Number(trimmed);
    const integerResult = ValidationRules.isInteger(n);
    if (integerResult !== true) return null;
    
    return (n > 0) ? n : null; // Only positive IDs
  },

  
  isValidStatusFilter: (status, allowAll = true) => {
    if (status === 'all' && allowAll) return true;
    const result = ValidationRules.validStatus(status);
    return result === true;
  },


  isValidEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    const result = ValidationRules.email(email.trim());
    return result === true;
  },

  
  normalizeArray: (value) => {
    if (!Array.isArray(value)) return [];
    return value.filter(item => item != null);
  },

  
  hasValidArrayItems: (value) => {
    const normalized = ValidationRules.normalizeArray(value);
    return normalized.length > 0;
  },

  invalidIdResponse: (fieldName = 'ID') => {
    return {
      ok: false,
      error: `${fieldName} debe ser un número entero positivo`
    };
  },

  
  invalidStatusResponse: (allowAll = true) => {
    const allowed = allowAll 
      ? "active', 'inactive' o 'all'" 
      : "active' o 'inactive'";
    return {
      ok: false,
      error: `El status debe ser '${allowed}'`
    };
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

  // Strict integer validation - only accepts number type
  strictInteger() {
    this.rules.push(ValidationRules.isStrictInteger);
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

  // New international text validations
  internationalText() {
    this.rules.push(ValidationRules.internationalText);
    return this;
  }

  phoneNumber() {
    this.rules.push(ValidationRules.phoneNumber);
    return this;
  }

  documentNumber() {
    this.rules.push(ValidationRules.documentNumber);
    return this;
  }

  locationText() {
    this.rules.push(ValidationRules.locationText);
    return this;
  }

  date() {
    this.rules.push(ValidationRules.isValidDate);
    return this;
  }

  dateNotInFuture() {
    this.rules.push(ValidationRules.dateNotInFuture);
    return this;
  }

  positiveNumber() {
    this.rules.push(ValidationRules.positiveNumber);
    return this;
  }

  boolean() {
    this.rules.push(ValidationRules.isBoolean);
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
      nameValidator.string().minLength(1).maxLength(150);
    }
      
    // Schedule validation
    if (shouldValidateField(data.schedule)) {
      const scheduleValidator = validator.field('schedule', data.schedule);
      if (!options.partial) scheduleValidator.required();
      scheduleValidator.string().minLength(1).maxLength(300);
    }
      
    // Location validation
    if (shouldValidateField(data.location)) {
      const locationValidator = validator.field('location', data.location);
      if (!options.partial) locationValidator.required();
      locationValidator.string().minLength(1).maxLength(300);
    }
      
    // Email validation with format checking
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().minLength(1).email().maxLength(150);
    }
      
    // Description validation
    if (shouldValidateField(data.description)) {
      const descriptionValidator = validator.field('description', data.description);
      if (!options.partial) descriptionValidator.required();
      descriptionValidator.string().minLength(1).maxLength(750);
    }
      
    // Status validation (active/inactive)
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * User entity validator
   * Schema: email (String @id), name (VarChar 150), password (VarChar 255), status (VarChar 25)
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
    
    // Email validation (PRIMARY KEY, reasonable limit for emails)
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().minLength(1).email().maxLength(254); // RFC 5321 standard max email length
    }
    
    // Name validation - matches DB VarChar(150)
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(150);
    }
    
    // Password validation (plain text before hashing)
    if (shouldValidateField(data.password)) {
      const passwordValidator = validator.field('password', data.password);
      if (!options.partial) passwordValidator.required();
      passwordValidator.string().minLength(6).maxLength(128); // Minimum security requirement and reasonable limit
    }
    
    // Status validation - matches DB VarChar(25)
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Category entity validator
   * Schema: idCategory, name (VarChar 150 @unique), status (VarChar 25)
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
    
    // Category name validation - matches DB VarChar(150) @unique
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().internationalText().maxLength(150);
    }
    
    // Status validation - matches DB VarChar(25)
    if (shouldValidateField(data.status)) {
      const statusValidator = validator.field('status', data.status);
      if (!options.partial) statusValidator.required();
      statusValidator.validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Role entity validator
   * Schema: idRole, rolName (VarChar 50 @unique), status (VarChar 25)
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
    
    // Role name validation - matches DB VarChar(50) @unique
    if (shouldValidateField(data.rolName)) {
      const nameValidator = validator.field('rolName', data.rolName);
      if (!options.partial) nameValidator.required();
      nameValidator.string().internationalText().maxLength(50);
    }
    
    // Status validation - matches DB VarChar(25)
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Cancer entity validator
   * @param {Object} data - The cancer data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  cancer: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    // In partial mode (update), only validate fields that are present
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };
    
    // Cancer name validation - required in create mode, optional in update mode
    if (shouldValidateField(data.cancerName)) {
      const nameValidator = validator.field('cancerName', data.cancerName);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).maxLength(100);
    }
      
    // Description validation
    if (shouldValidateField(data.description)) {
      const descriptionValidator = validator.field('description', data.description);
      if (!options.partial) descriptionValidator.required();
      descriptionValidator.string().minLength(1).maxLength(300);
    }
    
    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Asset entity validator
   * Schema: idAsset, idCategory (Int), idHeadquarter (Int), name (VarChar 50), 
   *         type (VarChar 50), description (VarChar 750), status (VarChar 25)
   * @param {Object} data - The asset data to validate  
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  asset: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    // In partial mode (update), only validate fields that are present
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Category ID validation
    if (shouldValidateField(data.idCategory)) {
      const categoryValidator = validator.field('idCategory', data.idCategory);
      if (!options.partial) categoryValidator.required();
      categoryValidator.integer();
    }

    // Headquarter ID validation  
    if (shouldValidateField(data.idHeadquarter)) {
      const headquarterValidator = validator.field('idHeadquarter', data.idHeadquarter);
      if (!options.partial) headquarterValidator.required();
      headquarterValidator.integer();
    }

    // Name validation - required in create mode, optional in update mode
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // Type validation
    if (shouldValidateField(data.type)) {
      const typeValidator = validator.field('type', data.type);
      if (!options.partial) typeValidator.required();
      typeValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // Description validation
    if (shouldValidateField(data.description)) {
      const descriptionValidator = validator.field('description', data.description);
      if (!options.partial) descriptionValidator.required();
      descriptionValidator.string().internationalText().maxLength(750);
    }
    
    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Emergency Contact entity validator
   * Schema: idEmergencyContact, nameEmergencyContact (VarChar 150), 
   *         emailEmergencyContact (VarChar 150), relationship (VarChar 50), status (VarChar 25)
   * @param {Object} data - The emergency contact data to validate  
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  emergencyContact: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    // In partial mode (update), only validate fields that are present
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Emergency contact name validation
    if (shouldValidateField(data.nameEmergencyContact)) {
      const nameValidator = validator.field('nameEmergencyContact', data.nameEmergencyContact);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(150);
    }

    // Emergency contact email validation
    if (shouldValidateField(data.emailEmergencyContact)) {
      const emailValidator = validator.field('emailEmergencyContact', data.emailEmergencyContact);
      if (!options.partial) emailValidator.required();
      emailValidator.string().minLength(1).email().maxLength(150);
    }

    // Relationship validation
    if (shouldValidateField(data.relationship)) {
      const relationshipValidator = validator.field('relationship', data.relationship);
      if (!options.partial) relationshipValidator.required();
      relationshipValidator.string().minLength(1).internationalText().maxLength(50);
    }
    
    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Supplier entity validator
   * Schema: idSupplier, name (VarChar 150), taxId (VarChar 20), type (VarChar 50),
   *         email (VarChar 150), address (VarChar 150), paymentTerms (VarChar 50),
   *         description (VarChar 750), status (VarChar 25)
   * @param {Object} data - The supplier data to validate  
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  supplier: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Name validation
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(150);
    }

    // Tax ID validation (optional field)
    if (shouldValidateField(data.taxId)) {
      validator.field('taxId', data.taxId).string().documentNumber().maxLength(20);
    }

    // Type validation
    if (shouldValidateField(data.type)) {
      const typeValidator = validator.field('type', data.type);
      if (!options.partial) typeValidator.required();
      typeValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // Email validation
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().minLength(1).email().maxLength(150);
    }

    // Address validation
    if (shouldValidateField(data.address)) {
      const addressValidator = validator.field('address', data.address);
      if (!options.partial) addressValidator.required();
      addressValidator.string().minLength(1).internationalText().maxLength(150);
    }

    // Payment terms validation
    if (shouldValidateField(data.paymentTerms)) {
      const paymentValidator = validator.field('paymentTerms', data.paymentTerms);
      if (!options.partial) paymentValidator.required();
      paymentValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // Description validation
    if (shouldValidateField(data.description)) {
      const descriptionValidator = validator.field('description', data.description);
      if (!options.partial) descriptionValidator.required();
      descriptionValidator.string().internationalText().maxLength(750);
    }

    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Volunteer entity validator
   * Schema: idVolunteer, name (VarChar 200), identifier (VarChar 30), country (VarChar 75),
   *         birthday (DateTime), email (VarChar 80), residence (VarChar 300), modality (VarChar 20),
   *         institution (VarChar 100), availableSchedule (VarChar 300), requiredHours (Int),
   *         startDate (DateTime), finishDate (DateTime), imageAuthorization (Boolean),
   *         notes (VarChar 250), status (VarChar 25)
   * @param {Object} data - The volunteer data to validate  
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  volunteer: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Name validation
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(200);
    }

    // Identifier validation
    if (shouldValidateField(data.identifier)) {
      const idValidator = validator.field('identifier', data.identifier);
      if (!options.partial) idValidator.required();
      idValidator.string().minLength(1).documentNumber().maxLength(30);
    }

    // Country validation
    if (shouldValidateField(data.country)) {
      const countryValidator = validator.field('country', data.country);
      if (!options.partial) countryValidator.required();
      countryValidator.string().minLength(1).locationText().maxLength(75);
    }

    // Birthday validation
    if (shouldValidateField(data.birthday)) {
      const birthdayValidator = validator.field('birthday', data.birthday);
      if (!options.partial) birthdayValidator.required();
      birthdayValidator.date().dateNotInFuture();
    }

    // Email validation
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().email().maxLength(80);
    }

    // Residence validation
    if (shouldValidateField(data.residence)) {
      const residenceValidator = validator.field('residence', data.residence);
      if (!options.partial) residenceValidator.required();
      residenceValidator.string().minLength(1).internationalText().maxLength(300);
    }

    // Modality validation
    if (shouldValidateField(data.modality)) {
      const modalityValidator = validator.field('modality', data.modality);
      if (!options.partial) modalityValidator.required();
      modalityValidator.string().minLength(1).internationalText().maxLength(20);
    }

    // Institution validation
    if (shouldValidateField(data.institution)) {
      const institutionValidator = validator.field('institution', data.institution);
      if (!options.partial) institutionValidator.required();
      institutionValidator.string().minLength(1).internationalText().maxLength(100);
    }

    // Available schedule validation
    if (shouldValidateField(data.availableSchedule)) {
      const scheduleValidator = validator.field('availableSchedule', data.availableSchedule);
      if (!options.partial) scheduleValidator.required();
      scheduleValidator.string().minLength(1).internationalText().maxLength(300);
    }

    // Required hours validation (optional field, must be non-negative integer)
    if (shouldValidateField(data.requiredHours)) {
      validator.field('requiredHours', data.requiredHours).strictInteger().positiveNumber();
    }

    // Start date validation
    if (shouldValidateField(data.startDate)) {
      const startDateValidator = validator.field('startDate', data.startDate);
      if (!options.partial) startDateValidator.required();
      startDateValidator.date();
    }

    // Finish date validation (optional field)
    if (shouldValidateField(data.finishDate)) {
      validator.field('finishDate', data.finishDate).date();
    }

    // Image authorization validation
    if (shouldValidateField(data.imageAuthorization)) {
      const authValidator = validator.field('imageAuthorization', data.imageAuthorization);
      if (!options.partial) authValidator.required();
      authValidator.boolean();
    }

    // Notes validation (optional field)
    if (shouldValidateField(data.notes)) {
      validator.field('notes', data.notes).string().internationalText().maxLength(250);
    }

    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }

    // Cross-field validation: startDate must be before finishDate
    // Only validate if both dates are provided
    if (shouldValidateField(data.startDate) && shouldValidateField(data.finishDate)) {
      const startDate = ValidationRules.parseDate(data.startDate);
      const finishDate = ValidationRules.parseDate(data.finishDate);

      if (startDate && finishDate) {
        if (startDate > finishDate) {
          const congruenceValidator = validator.field('dateCongruence', null);
          congruenceValidator.custom(() => 'La fecha de inicio no puede ser posterior a la fecha de finalización');
        }
      }
    }
    
    return validator.validate();
  },

  /**
   * Phone entity validator
   * Schema: idPhone, phone (Int)
   * @param {Object} data - The phone data to validate  
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  phone: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Phone number validation
    if (shouldValidateField(data.phone)) {
      const phoneValidator = validator.field('phone', data.phone);
      if (!options.partial) phoneValidator.required();
      phoneValidator.integer();
    }
    
    return validator.validate();
  },

  /**
   * Activity entity validator
   * Schema: idActivity (PK), idHeadquarter, title (150), description (750), type (50), 
   * modality (25), capacity (Int), location (300), date (DateTime), status (25)
   * @param {Object} data - The activity data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  activity: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Headquarter ID validation
    if (shouldValidateField(data.idHeadquarter)) {
      const headquarterValidator = validator.field('idHeadquarter', data.idHeadquarter);
      if (!options.partial) headquarterValidator.required();
      headquarterValidator.integer();
    }

    // Title validation
    if (shouldValidateField(data.title)) {
      const titleValidator = validator.field('title', data.title);
      if (!options.partial) titleValidator.required();
      titleValidator.string().minLength(1).internationalText().maxLength(150);
    }

    // Type validation
    if (shouldValidateField(data.type)) {
      const typeValidator = validator.field('type', data.type);
      if (!options.partial) typeValidator.required();
      typeValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // Modality validation
    if (shouldValidateField(data.modality)) {
      const modalityValidator = validator.field('modality', data.modality);
      if (!options.partial) modalityValidator.required();
      modalityValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Capacity validation
    if (shouldValidateField(data.capacity)) {
      const capacityValidator = validator.field('capacity', data.capacity);
      if (!options.partial) capacityValidator.required();
      capacityValidator.integer();
    }

    // Location validation
    if (shouldValidateField(data.location)) {
      const locationValidator = validator.field('location', data.location);
      if (!options.partial) locationValidator.required();
      locationValidator.string().minLength(1).locationText().maxLength(300);
    }

    // Date validation
    if (shouldValidateField(data.date)) {
      const dateValidator = validator.field('date', data.date);
      if (!options.partial) dateValidator.required();
      dateValidator.date();
    }

    // Description validation
    if (shouldValidateField(data.description)) {
      const descValidator = validator.field('description', data.description);
      if (!options.partial) descValidator.required();
      descValidator.string().minLength(1).internationalText().maxLength(750);
    }

    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Godparent entity validator  
   * Schema: idGodparent (PK), idSurvivor (optional FK), idHeadquarter, name (200), 
   * email (150), paymentMethod (50), startDate, finishDate (optional), description (250), status (25)
   * @param {Object} data - The godparent data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  godparent: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Survivor ID validation (optional field)
    if (shouldValidateField(data.idSurvivor)) {
      validator.field('idSurvivor', data.idSurvivor).integer();
    }

    // Headquarter ID validation
    if (shouldValidateField(data.idHeadquarter)) {
      const headquarterValidator = validator.field('idHeadquarter', data.idHeadquarter);
      if (!options.partial) headquarterValidator.required();
      headquarterValidator.integer();
    }

    // Name validation
    if (shouldValidateField(data.name)) {
      const nameValidator = validator.field('name', data.name);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(200);
    }

    // Email validation
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().minLength(1).email().maxLength(150);
    }

    // Payment method validation
    if (shouldValidateField(data.paymentMethod)) {
      const paymentValidator = validator.field('paymentMethod', data.paymentMethod);
      if (!options.partial) paymentValidator.required();
      paymentValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // Start date validation
    if (shouldValidateField(data.startDate)) {
      const startDateValidator = validator.field('startDate', data.startDate);
      if (!options.partial) startDateValidator.required();
      startDateValidator.date();
    }

    // Finish date validation (optional field)
    if (shouldValidateField(data.finishDate)) {
      validator.field('finishDate', data.finishDate).date();
    }

    // Date congruence validation: startDate should be before or equal to finishDate
    if (shouldValidateField(data.startDate) && shouldValidateField(data.finishDate)) {
      const startDate = ValidationRules.parseDate(data.startDate);
      const finishDate = ValidationRules.parseDate(data.finishDate);

      if (startDate && finishDate) {
        if (startDate > finishDate) {
          const congruenceValidator = validator.field('dateCongruence', null);
          congruenceValidator.custom(() => 'La fecha de inicio no puede ser posterior a la fecha de finalización');
        }
      }
    }

    // Description validation
    if (shouldValidateField(data.description)) {
      const descValidator = validator.field('description', data.description);
      if (!options.partial) descValidator.required();
      descValidator.string().internationalText().maxLength(250);
    }

    // Status validation
    if (shouldValidateField(data.status)) {
      validator.field('status', data.status).validStatus();
    }
    
    return validator.validate();
  },

  /**
   * Survivor entity validator
   * Schema: idSurvivor (PK), idHeadquarter, survivorName (200), documentNumber (30), 
   * country (75), birthday, email (150), residence (300), genre (25), workingCondition (50),
   * CONAPDIS (Boolean), IMAS (Boolean), physicalFileStatus (25), medicalRecord (25),
   * dateHomeSINRUBE (25), foodBank (25), socioEconomicStudy (25), notes (250, optional), status (25)
   * @param {Object} data - The survivor data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validates provided fields (for updates)
   * @returns {Object} Validation result with isValid and errors
   */
  survivor: (data, options = { partial: false }) => {
    const validator = Validator.create();
    
    const shouldValidateField = (fieldValue) => {
      return !options.partial || (fieldValue !== undefined && fieldValue !== null);
    };

    // Headquarter ID validation
    if (shouldValidateField(data.idHeadquarter)) {
      const headquarterValidator = validator.field('idHeadquarter', data.idHeadquarter);
      if (!options.partial) headquarterValidator.required();
      headquarterValidator.integer();
    }

    // Survivor name validation
    if (shouldValidateField(data.survivorName)) {
      const nameValidator = validator.field('survivorName', data.survivorName);
      if (!options.partial) nameValidator.required();
      nameValidator.string().minLength(1).internationalText().maxLength(200);
    }

    // Document number validation
    if (shouldValidateField(data.documentNumber)) {
      const docValidator = validator.field('documentNumber', data.documentNumber);
      if (!options.partial) docValidator.required();
      docValidator.string().minLength(1).documentNumber().maxLength(30);
    }

    // Country validation
    if (shouldValidateField(data.country)) {
      const countryValidator = validator.field('country', data.country);
      if (!options.partial) countryValidator.required();
      countryValidator.string().minLength(1).internationalText().maxLength(75);
    }

    // Birthday validation
    if (shouldValidateField(data.birthday)) {
      const birthdayValidator = validator.field('birthday', data.birthday);
      if (!options.partial) birthdayValidator.required();
      birthdayValidator.date();
    }

    // Email validation
    if (shouldValidateField(data.email)) {
      const emailValidator = validator.field('email', data.email);
      if (!options.partial) emailValidator.required();
      emailValidator.string().email().maxLength(150);
    }

    // Residence validation
    if (shouldValidateField(data.residence)) {
      const residenceValidator = validator.field('residence', data.residence);
      if (!options.partial) residenceValidator.required();
      residenceValidator.string().minLength(1).locationText().maxLength(300);
    }

    // Genre validation
    if (shouldValidateField(data.genre)) {
      const genreValidator = validator.field('genre', data.genre);
      if (!options.partial) genreValidator.required();
      genreValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Working condition validation
    if (shouldValidateField(data.workingCondition)) {
      const workingValidator = validator.field('workingCondition', data.workingCondition);
      if (!options.partial) workingValidator.required();
      workingValidator.string().minLength(1).internationalText().maxLength(50);
    }

    // CONAPDIS validation
    if (shouldValidateField(data.CONAPDIS)) {
      const conapdisValidator = validator.field('CONAPDIS', data.CONAPDIS);
      if (!options.partial) conapdisValidator.required();
      conapdisValidator.boolean();
    }

    // IMAS validation
    if (shouldValidateField(data.IMAS)) {
      const imasValidator = validator.field('IMAS', data.IMAS);
      if (!options.partial) imasValidator.required();
      imasValidator.boolean();
    }

    // Physical file status validation
    if (shouldValidateField(data.physicalFileStatus)) {
      const physicalValidator = validator.field('physicalFileStatus', data.physicalFileStatus);
      if (!options.partial) physicalValidator.required();
      physicalValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Medical record validation
    if (shouldValidateField(data.medicalRecord)) {
      const medicalValidator = validator.field('medicalRecord', data.medicalRecord);
      if (!options.partial) medicalValidator.required();
      medicalValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Date home SINRUBE validation
    if (shouldValidateField(data.dateHomeSINRUBE)) {
      const sinrubeValidator = validator.field('dateHomeSINRUBE', data.dateHomeSINRUBE);
      if (!options.partial) sinrubeValidator.required();
      sinrubeValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Food bank validation
    if (shouldValidateField(data.foodBank)) {
      const foodBankValidator = validator.field('foodBank', data.foodBank);
      if (!options.partial) foodBankValidator.required();
      foodBankValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Socio economic study validation
    if (shouldValidateField(data.socioEconomicStudy)) {
      const socioValidator = validator.field('socioEconomicStudy', data.socioEconomicStudy);
      if (!options.partial) socioValidator.required();
      socioValidator.string().minLength(1).internationalText().maxLength(25);
    }

    // Notes validation (optional field)
    if (shouldValidateField(data.notes)) {
      validator.field('notes', data.notes).string().internationalText().maxLength(250);
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
  ValidationRules,     // Individual validation rule functions + controller helpers
  EntityValidators     // Pre-configured validators for specific entities
};