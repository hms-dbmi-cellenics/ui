import { inspectFile, Verdict } from '../../../utils/upload/fileInspector';

jest.mock('../../../utils/upload/readFileToBuffer');

describe('fileInspector', () => {
  it('Detects invalid filenames', async () => {
    const file = {
      name: 'random_file.gz',
      slice() {},
    };

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.INVALID_NAME);
  });
});
