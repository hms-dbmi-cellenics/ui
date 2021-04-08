import validateSampleName from '../../utils/validateSampleName';

describe('validateSampleName unit test', () => {
  it('sample names minimal 1 char ', () => {
    const validName1 = '1';
    expect(validateSampleName(validName1)).toEqual(true);

    const validName2 = ' A';
    expect(validateSampleName(validName2)).toEqual(true);

    const inValidName1 = '';
    expect(validateSampleName(inValidName1)).not.toEqual(true);
    expect(validateSampleName(inValidName1)).toMatchSnapshot();

    const inValidName2 = ' ';
    expect(validateSampleName(inValidName2)).toMatchSnapshot();
  });

  it('sample name should not contain invalid characters', () => {
    const invalidName = 'Yummy: Another great sample!';

    expect(validateSampleName(invalidName)).not.toEqual(true);
    expect(validateSampleName(invalidName)).toMatchSnapshot();
  });

  it('sample name should not be the same with existing samples', () => {
    const validName = 'T2';
    const sampleNames = [
      'WT1',
      'WT2',
      'OK',
    ];
    const inValidName = sampleNames[0];

    expect(validateSampleName(validName, sampleNames)).toEqual(true);
    expect(validateSampleName(inValidName, sampleNames)).not.toEqual(false);
    expect(validateSampleName(inValidName)).toMatchSnapshot();
  });
});
