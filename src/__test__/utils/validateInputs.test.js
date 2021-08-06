import validateInputs, {
  rules, errorMessages,
} from '../../utils/validateInputs';

describe('validateUnit unit test', () => {
  it('Defaults to true if not given checks', () => {
    const input = 'Input';
    const checks = [];

    const { isValid, results } = validateInputs(input, checks);

    expect(isValid).toEqual(true);
    expect(results).toEqual([]);
  });

  it('Can take the 1 or an array of arguments', () => {
    const input = 'Input';
    const singleCheck = rules.MIN_1_CHAR;

    const singleCheckResult = validateInputs(input, singleCheck);

    expect(singleCheckResult.isValid).toEqual(true);

    const multipleChecks = [rules.MIN_1_CHAR, rules.MIN_2_SEQUENTIAL_CHARS];
    const multipleChecksResult = validateInputs(input, multipleChecks);

    expect(multipleChecksResult.isValid).toEqual(true);
  });

  it('Each check is checked', () => {
    const input = 'Input';
    const checks = [
      rules.MIN_1_CHAR,
      rules.MIN_2_SEQUENTIAL_CHARS,
      rules.ALPHANUM_DASH_SPACE,
    ];

    // eslint-disable-next-line no-unused-vars
    const { isValid, results } = validateInputs(input, checks);

    expect(results.length).toEqual(checks.length);
  });

  it('Correctly validates minimal 1 char ', () => {
    const validName = 'Project 1';
    const checks = [rules.MIN_1_CHAR];

    const { isValid, results: validResult } = validateInputs(validName, checks);

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const inValidName = '';

    const { isValid: isInvalid, results: invalidResult } = validateInputs(inValidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.MIN_1_CHAR]);
  });

  it('Correctly validates minimal 8 char ', () => {
    const validName = 'Project 1';
    const checks = [rules.MIN_8_CHARS];

    const { isValid, results: validResult } = validateInputs(validName, checks);

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const inValidName = 'asd';

    const { isValid: isInvalid, results: invalidResult } = validateInputs(inValidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.MIN_8_CHARS]);
  });

  it('Correctly validates names has to at least have two consequent letters', () => {
    const validName = ' ab  cd  ef  gh';
    const checks = [rules.MIN_2_SEQUENTIAL_CHARS];

    const { isValid, results: validResult } = validateInputs(validName, checks);

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const invalidName = 'a b c d e f g h';

    const { isValid: isInvalid, results: invalidResult } = validateInputs(invalidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.MIN_2_SEQUENTIAL_CHARS]);
  });

  it('Correctly invalidate names with invalid characters (alphanum, dash, space)', () => {
    const invalidName = 'Yumm: A great project!';
    const checks = [rules.ALPHANUM_DASH_SPACE];

    const { isValid, results: invalidResult } = validateInputs(invalidName, checks);

    expect(isValid).toEqual(false);
    expect(invalidResult).toEqual([errorMessages.ALPHANUM_DASH_SPACE]);
  });

  it('Correctly invalidate names with invalid characters (alphanum, space)', () => {
    const invalidName = 'Track-1!';
    const checks = [rules.ALPHANUM_SPACE];

    const { isValid, results: invalidResult } = validateInputs(invalidName, checks);

    expect(isValid).toEqual(false);
    expect(invalidResult).toEqual([errorMessages.ALPHANUM_SPACE]);
  });

  it('Correctly invalidate names that does not begin with alphabets', () => {
    const invalidName = '24 Carats';
    const checks = [rules.START_WITH_ALPHABET];

    const { isValid, results: invalidResult } = validateInputs(invalidName, checks);

    expect(isValid).toEqual(false);
    expect(invalidResult).toEqual([errorMessages.START_WITH_ALPHABET]);
  });

  it('Correctly invalidate invalid email', () => {
    const invalidEmails = ['abc.def', 'abc.def@mail.c', 'abc.def@mail#archive.com', 'abc.def@mail', 'abc.def@mail..com'];

    const checks = [rules.VALID_EMAIL];

    invalidEmails.forEach((email) => {
      const { isValid, results: invalidResult } = validateInputs(email, checks);
      expect(isValid).toEqual(false);
      expect(invalidResult).toEqual([errorMessages.VALID_EMAIL]);
    });
  });

  it('Correctly invalidates should not be the same with existing values', () => {
    const projectNames = [
      'Project 1',
      'Project 2',
      'Project 3',
    ];
    const validName = 'Project 4';
    const invalidName = 'Project 1';

    const checks = [rules.UNIQUE_NAME];

    const { isValid, results } = validateInputs(
      validName, checks, { existingNames: projectNames },
    );

    expect(isValid).toEqual(true);
    expect(results).toEqual([true]);

    const { isValid: isInvalid, results: invalidResult } = validateInputs(
      invalidName, checks, { existingNames: projectNames },
    );

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.UNIQUE_NAME]);
  });
});
