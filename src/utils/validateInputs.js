const rules = {
  // Minimum 1 character
  MIN_1_CHAR(input) {
    const errMsg = 'Min 1 alphanumeric character';

    if (input.length <= 1) return errMsg;
    return true;
  },

  // Minimum 8 characters
  MIN_8_CHARS(input) {
    const errMsg = 'Min 8 alphanumeric characters';

    if (input.length < 8) return errMsg;
    return true;
  },

  // Minimum 2 sequential characters
  MIN_2_SEQUENTIAL_CHARS(input) {
    const errMsg = 'Min. 2 characters in sequence';

    if (!input.match(/([a-zA-Z\d]{2,}){1,}/gm)) return errMsg;
    return true;
  },

  // Only alphanumeric, space, undersscore and dash is allowed
  ALPHANUM_DASH_SPACE(input) {
    const errMsg = 'Only letters, numbers, space, _, and - allowed';

    if (input.match(/[^a-zA-Z\s\d-_]/gm)) return errMsg;
    return true;
  },

  // Enforce unique name - Fail if input exists in existing names
  UNIQUE_NAME(input, params) {
    const errMsg = 'Name is already used';

    if (!params?.existingNames || params.existingNames.length === 0) return true;

    const { existingNames } = params;

    if (existingNames instanceof Array
      && existingNames.includes(input)) return errMsg;

    if (existingNames instanceof Set
      && existingNames.has(input)) return errMsg;

    return true;
  },
};

const validateInput = (input, checks, params, renderer) => {
  if (checks.length === 0) return true;

  let results = checks.map((check) => rules[check](input, params));
  const isValid = results.every((check) => check === true);

  // Renderer function can be specified to return Reach node
  if (renderer) {
    results = renderer(results);
  }

  return [isValid, results];
};

export default validateInput;
