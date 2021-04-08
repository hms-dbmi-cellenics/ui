const errorMessages = {
  MIN_1_CHAR: 'Min 1 alphanumeric character',
  INVALID_CHARS: 'Invalid characters',
  NAME_EXISTS: 'A sample with the same name exists',
};

const validateSampleName = (input, sampleNames) => {
  if (input.length < 1 || !input.match(/[a-zA-Z\d]{1,}/gm)) {
    return errorMessages.MIN_1_CHAR;
  }

  if (!input.match(/^[a-zA-Z\s\d-_]{1,}$/gm)) {
    return errorMessages.INVALID_CHARS;
  }

  if (sampleNames instanceof Array
    && sampleNames.includes(input)) {
    return errorMessages.NAME_EXISTS;
  }

  if (sampleNames instanceof Set
    && sampleNames.has(input)) {
    return errorMessages.NAME_EXISTS;
  }

  return true;
};

export default validateSampleName;
