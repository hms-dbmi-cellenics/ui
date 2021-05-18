import validateInputs, {
  rules, errorMessages,
} from '../../utils/validateInputs';

describe('validateUnit unit test', () => {
  it('Defaults to true if not given checks', () => {
    const input = 'Input';
    const checks = [];

    const [isValid, result] = validateInputs(input, checks);

    expect(isValid).toEqual(true);
    expect(result).toEqual([]);
  });

  it('Each check is checked', () => {
    const input = 'Input';
    const checks = [
      rules.MIN_1_CHAR,
      rules.MIN_2_SEQUENTIAL_CHARS,
      rules.ALPHANUM_DASH_SPACE,
    ];

    // eslint-disable-next-line no-unused-vars
    const [_, result] = validateInputs(input, checks);

    expect(result.length).toEqual(checks.length);
  });

  it('Correctly validates minimal 1 char ', () => {
    const validName = 'Project 1';
    const checks = [rules.MIN_1_CHAR];

    const [isValid, validResult] = validateInputs(validName, checks);

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const inValidName = '';

    const [isInvalid, invalidResult] = validateInputs(inValidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.MIN_1_CHAR]);
  });

  it('Correctly validates minimal 8 char ', () => {
    const validName = 'Project 1';
    const checks = [rules.MIN_8_CHARS];

    const [isValid, validResult] = validateInputs(validName, checks);

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const inValidName = 'asd';

    const [isInvalid, invalidResult] = validateInputs(inValidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.MIN_8_CHARS]);
  });

  it('Correctly validates names has to at least have two consequent letters', () => {
    const validName = ' ab  cd  ef  gh';
    const checks = [rules.MIN_2_SEQUENTIAL_CHARS];

    const [isValid, validResult] = validateInputs(validName, checks);

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const inValidName = 'a b c d e f g h';

    const [isInvalid, invalidResult] = validateInputs(inValidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.MIN_2_SEQUENTIAL_CHARS]);
  });

  it('Correctly invalidate names with invalid characters', () => {
    const invalidName = 'Yumm: A great project!';
    const checks = [rules.ALPHANUM_DASH_SPACE];

    const [isInvalid, invalidResult] = validateInputs(invalidName, checks);

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.ALPHANUM_DASH_SPACE]);
  });

  it('Correctly invalidates should not be the same with existing projects', () => {
    const projectNames = [
      'Project 1',
      'Project 2',
      'Project 3',
    ];
    const validName = 'Project 4';
    const invalidName = 'Project 1';

    const checks = [rules.UNIQUE_NAME];

    const [isValid, validResult] = validateInputs(
      validName, checks, { existingNames: projectNames },
    );

    expect(isValid).toEqual(true);
    expect(validResult).toEqual([true]);

    const [isInvalid, invalidResult] = validateInputs(
      invalidName, checks, { existingNames: projectNames },
    );

    expect(isInvalid).not.toEqual(true);
    expect(invalidResult).toEqual([errorMessages.UNIQUE_NAME]);
  });
});
