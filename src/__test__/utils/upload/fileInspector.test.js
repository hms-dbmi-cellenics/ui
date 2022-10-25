import { sampleTech } from 'utils/constants';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';
import readFileToBuffer from 'utils/upload/readFileToBuffer';

jest.mock('utils/upload/readFileToBuffer');

describe('fileInspector', () => {
  it('Detects invalid filenames', async () => {
    const file = {
      name: 'random_file.gz',
    };

    expect(await inspectFile(file, sampleTech['10X']))
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

    expect(await inspectFile(file, sampleTech['10X']))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, sampleTech['10X']))
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

    expect(await inspectFile(file, sampleTech['10X']))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, sampleTech['10X']))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, sampleTech['10X']))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, sampleTech['10X']))
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

    expect(await inspectFile(file, sampleTech['10X']))
      .toEqual(Verdict.VALID_UNZIPPED);

    expect(await inspectFile(file, sampleTech['10X']))
      .toEqual(Verdict.INVALID_FORMAT);
  });

  it('Inspects a BD Rhapsody file properly', async () => {
    const file = {
      name: 'Sample_asdasd_someNAming_Expression_Data.st',
      slice() { },
    };
    readFileToBuffer
      .mockReturnValueOnce(
        Promise.resolve(Buffer.from([0x1f, 0x8b])),
      );
    expect(await inspectFile(file, sampleTech.RHAPSODY))
      .toEqual(Verdict.VALID_ZIPPED);
  });

  it('Wrong BD Rhapsody file return invalid verdict', async () => {
    const file = {
      name: 'BD_Rhapsody_fileInvalid_Expression_Data.exe',
      slice() { },
    };
    readFileToBuffer
      .mockReturnValueOnce(
        Promise.resolve(),
      );
    expect(await inspectFile(file, sampleTech.RHAPSODY))
      .toEqual(Verdict.INVALID_NAME);
  });

  it('Unrecognised technology returns invalid verdict', async () => {
    const file = {
      name: 'someFile.exe',
      slice() { },
    };
    expect(await inspectFile(file, 'Invalid technology'))
      .toEqual(Verdict.INVALID_FORMAT);
  });
});
