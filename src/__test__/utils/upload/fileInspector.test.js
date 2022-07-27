import { inspectFile, Verdict } from 'utils/upload/fileInspector';
import readFileToBuffer from 'utils/upload/readFileToBuffer';

jest.mock('utils/upload/readFileToBuffer');

describe('fileInspector', () => {
  it('Detects invalid filenames', async () => {
    const file = {
      name: 'random_file.gz',
    };

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.INVALID_NAME);
  });

  it('Inspects a matrix file properly', async () => {
    const file = {
      name: 'matrix.mtx',
      slice() { },
    };

    readFileToBuffer
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('%%MatrixMarket')),
      )
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('Def. not a matrix')),
      );

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.INVALID_FORMAT);
  });

  it('Inspects a features file properly', async () => {
    const file = {
      name: 'features.tsv',
      slice() { },
    };

    readFileToBuffer
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('ENS00123456789-1')),
      )
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('lnc_inter_chr1_1')),
      )
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('"ENS00123456789-')),
      )
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('"lnc_inter_chr1_')),
      );

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.VALID_UNZIPPED);
  });

  it('Detects a barcodes file properly', async () => {
    const file = {
      name: 'barcodes.tsv',
      slice() { },
    };

    readFileToBuffer
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('ACGTACGTACGT-1')),
      )
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from('ACGTACGTACGT-1\t')),
      );

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, '10X Chromium'))
      .toEqual(Verdict.INVALID_FORMAT);
  });
});
