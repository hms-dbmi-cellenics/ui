const rules = {
  MIN_1_CHAR: 'MIN_1_CHAR',
  MIN_8_CHARS: 'MIN_8_CHARS',
  MIN_2_SEQUENTIAL_CHARS: 'MIN_2_SEQUENTIAL_CHARS',
  ALPHANUM_SPACE: 'ALPHANUM_SPACE',
  ALPHANUM_DASH_SPACE: 'ALPHANUM_DASH_SPACE',
  UNIQUE_NAME: 'UNIQUE_NAME',
  UNIQUE_NAME_CASE_INSENSITIVE: 'UNIQUE_NAME_CASE_INSENSITIVE',
  START_WITH_ALPHABET: 'START_WITH_ALPHABET',
  VALID_EMAIL: 'VALID_EMAIL',
};

const errorMessages = {
  [rules.MIN_1_CHAR]: 'Min 1 alphanumeric characters',
  [rules.MIN_8_CHARS]: 'Min 8 alphanumeric characters',
  [rules.MIN_2_SEQUENTIAL_CHARS]: 'Min. 2 characters in sequence',
  [rules.ALPHANUM_SPACE]: 'Only letters, numbers and space allowed',
  [rules.ALPHANUM_DASH_SPACE]: 'Only letters, numbers, space, _, and - allowed',
  [rules.UNIQUE_NAME]: 'Name is already used',
  [rules.UNIQUE_NAME_CASE_INSENSITIVE]: 'Name is already used',
  [rules.START_WITH_ALPHABET]: 'Name can only start with letter',
  [rules.VALID_EMAIL]: 'Invalid email',
};

const validationFns = {
  // Minimum 1 character
  [rules.MIN_1_CHAR](checkName, input) {
    if (!input.match(/^[a-zA-Z\d]{1,}/gm)) return errorMessages[checkName];
    return true;
  },

  // Minimum 8 characters
  [rules.MIN_8_CHARS](checkName, input) {
    if (input.length < 8) return errorMessages[checkName];
    return true;
  },

  // Minimum 2 sequential characters
  [rules.MIN_2_SEQUENTIAL_CHARS](checkName, input) {
    if (!input.match(/([a-zA-Z\d]{2,}){1,}/gm)) return errorMessages[checkName];
    return true;
  },

  // Only alphanumeric and space are allowed
  [rules.ALPHANUM_SPACE](checkName, input) {
    if (input.match(/[^a-zA-Z\s\d]/gm)) return errorMessages[checkName];
    return true;
  },

  // Only alphanumeric, space, undersscore and dash are allowed
  [rules.ALPHANUM_DASH_SPACE](checkName, input) {
    if (input.match(/[^a-zA-Z\s\d-_]/gm)) return errorMessages[checkName];
    return true;
  },

  // Enforce unique name - Fail if input exists in existing names
  [rules.UNIQUE_NAME](checkName, input, params) {
    if (!params?.existingNames || params.existingNames.length === 0) return true;

    const { existingNames } = params;

    if (existingNames instanceof Array
      && existingNames.includes(input)) return errorMessages[checkName];

    if (existingNames instanceof Set
      && existingNames.has(input)) return errorMessages[checkName];

    return true;
  },

  // Enforce unique name - Fail if input exists in existing names
  [rules.UNIQUE_NAME_CASE_INSENSITIVE](checkName, input, params) {
    if (!params?.existingNames || params.existingNames.length === 0) return true;

    const { existingNames } = params;

    const existingNamesArr = existingNames instanceof Set
      ? Array.from(existingNames) : existingNames;
    const lowerCaseNames = existingNamesArr.map((name) => name.toLowerCase());

    if (lowerCaseNames.includes(input.toLowerCase())) return errorMessages[checkName];

    return true;
  },

  // Start with alphabet - Fail if input starts with non-alphabetic character
  [rules.START_WITH_ALPHABET](checkName, input) {
    if (input.match(/^[^a-zA-Z]/gm)) return errorMessages[checkName];
    return true;
  },

  // Valid email - Fail if input is not a valid email
  [rules.VALID_EMAIL](checkName, input) {
    // Valid email regex based on RC 5322 - https://emailregex.com/
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!input.match(emailRegex)) return errorMessages[checkName];
    return true;
  },

};

/**
 * @typedef {Object} ValidateInputsReturns
 * @property {boolean} isValid - True if all checks passed, false otherwise
 * @property {results} results - An array of validation results or error messages
 */

/**
 * Valide input according to a list of checks which might be configured by passing params.
 * @param {string} input - The input string to validate.
 * @param {string[]} checks - Functions to check.
 * @param {Object} params - Optional parameters passed to checking functions
 * @returns {ValidateInputsReturns} - An object with isValid and results properties
 */

const validateInput = (input, checks, params) => {
  // eslint-disable-next-line no-param-reassign
  if (!Array.isArray(checks)) checks = [checks];

  if (checks.length === 0) {
    return {
      isValid: true,
      results: [],
    };
  }

  const results = checks.map((checkName) => validationFns[checkName](checkName, input, params));
  const isValid = results.every((check) => check === true);

  return {
    isValid,
    results,
  };
};

export default validateInput;
export {
  rules,
  errorMessages,
};
