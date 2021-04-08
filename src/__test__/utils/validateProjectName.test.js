import validateProjectName from '../../utils/validateProjectName';

describe('validateProjectName unit test', () => {
  it('project names minimal 8 char ', () => {
    const validName = 'Project 1';

    expect(validateProjectName(validName)).toEqual(true);

    const inValidName = 'asd';
    expect(validateProjectName(inValidName)).not.toEqual(true);
    expect(validateProjectName(inValidName)).toMatchSnapshot();
  });

  it('project names has to at least have two consequent letters', () => {
    const validName = ' ab  cd  ef  gh';
    expect(validateProjectName(validName)).toEqual(true);

    const inValidName = 'a b c d e f g h';
    expect(validateProjectName(inValidName)).not.toEqual(false);
    expect(validateProjectName(inValidName)).toMatchSnapshot();
  });

  it('project name should not contain invalid characters', () => {
    const invalidName = 'Yumm: A great project!';

    expect(validateProjectName(invalidName)).not.toEqual(true);
    expect(validateProjectName(invalidName)).toMatchSnapshot();
  });

  it('project name should not be the same with existing projects', () => {
    const validName = 'Project 4';
    const projectNames = [
      'Project 1',
      'Project 2',
      'Project 3',
    ];
    const inValidName = projectNames[0];

    expect(validateProjectName(validName, projectNames)).toEqual(true);
    expect(validateProjectName(inValidName, projectNames)).not.toEqual(false);
    expect(validateProjectName(inValidName)).toMatchSnapshot();
  });
});
