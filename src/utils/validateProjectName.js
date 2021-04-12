const defaultErrorMessages = {
  MIN_8_CHAR: 'Min. 8 characters required',
  MIN_2_CHAR: 'Min. 2 characters in sequence',
  INVALID_CHARS: 'Only letters, numbers, space, _, and - allowed',
  NAME_EXISTS: 'A project with the same name exists',
};

const validateProjectName = (input, projectNames, customErrors) => {
  const errorMessages = {
    ...defaultErrorMessages,
    customErrors,
  };

  if (input.length < 8) {
    return errorMessages.MIN_8_CHAR;
  }

  if (!input.match(/([a-zA-Z\d]{2,}){1,}/gm)) {
    return errorMessages.MIN_2_CHAR;
  }

  if (!input.match(/^[a-zA-Z\s\d-_]{8,}$/gm)) {
    return errorMessages.INVALID_CHARS;
  }

  if (projectNames instanceof Array
    && projectNames.includes(input)) {
    return errorMessages.NAME_EXISTS;
  }

  if (projectNames instanceof Set
    && projectNames.has(input)) {
    return errorMessages.NAME_EXISTS;
  }

  return true;
};

export default validateProjectName;
