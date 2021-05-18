const rules = {
  MIN_1_CHAR: 'MIN_1_CHAR',
  MIN_8_CHARS: 'MIN_8_CHARS',
  MIN_2_SEQUENTIAL_CHARS: 'MIN_2_SEQUENTIAL_CHARS',
  ALPHANUM_DASH_SPACE: 'ALPHANUM_DASH_SPACE',
  UNIQUE_NAME: 'UNIQUE_NAME',
};

const errorMessages = {
  [rules.MIN_1_CHAR]: 'Min 1 alphanumeric characters',
  [rules.MIN_8_CHARS]: 'Min 8 alphanumeric characters',
  [rules.MIN_2_SEQUENTIAL_CHARS]: 'Min. 2 characters in sequence',
  [rules.ALPHANUM_DASH_SPACE]: 'Only letters, numbers, space, _, and - allowed',
  [rules.UNIQUE_NAME]: 'Name is already used',
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

  // Only alphanumeric, space, undersscore and dash is allowed
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
};

const validateInput = (input, checks, params, renderer) => {
  if (checks.length === 0) return [true, []];

  let results = checks.map((checkName) => validationFns[checkName](checkName, input, params));
  const isValid = results.every((check) => check === true);

  // Renderer function can be specified to return Reach node
  if (renderer) {
    results = renderer(results);
  }

  return [isValid, results];
};

export default validateInput;
export {
  rules,
  errorMessages,
};
