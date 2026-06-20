import _ from 'lodash';
import validateXenium from 'utils/upload/validateXenium';
import sampleFileType from 'utils/sampleFileType';

// minimal Blob-like stub: validateXenium only uses .slice().arrayBuffer() and .size
const makeBlob = (data) => ({
  size: data.length,
  slice(start, end) { return makeBlob(data.slice(start, end)); },
  arrayBuffer() { return Promise.resolve(data.buffer); },
});

const HDF5_MAGIC = [0x89, 0x48, 0x44, 0x46, 0x0d, 0x0a, 0x1a, 0x0a];
const PARQUET_MAGIC = [0x50, 0x41, 0x52, 0x31]; // "PAR1"

// a valid parquet blob has the PAR1 marker at both ends with arbitrary body
const makeParquet = () => makeBlob(
  new Uint8Array([...PARQUET_MAGIC, 1, 2, 3, 4, 5, ...PARQUET_MAGIC]),
);
const makeH5 = () => makeBlob(new Uint8Array([...HDF5_MAGIC, 9, 9, 9, 9]));

const makeSample = () => ({
  files: {
    [sampleFileType.XENIUM_CELL_FEATURE_MATRIX]: { fileObject: makeH5() },
    [sampleFileType.XENIUM_CELLS]: { fileObject: makeParquet() },
    [sampleFileType.XENIUM_CELL_BOUNDARIES]: { fileObject: makeParquet() },
  },
});

describe('validateXenium', () => {
  it('resolves for a valid Xenium sample', async () => {
    await expect(validateXenium(makeSample())).resolves.toBeUndefined();
  });

  it('throws when a required file is missing', async () => {
    const sample = makeSample();
    delete sample.files[sampleFileType.XENIUM_CELLS];
    await expect(validateXenium(sample)).rejects.toThrow(/cells\.parquet/);
  });

  it('throws when the count matrix is not a valid HDF5 file', async () => {
    const sample = makeSample();
    sample.files[sampleFileType.XENIUM_CELL_FEATURE_MATRIX].fileObject = makeBlob(
      new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]),
    );
    await expect(validateXenium(sample)).rejects.toThrow(/valid HDF5/);
  });

  it('throws when a parquet file lacks the PAR1 marker', async () => {
    const sample = makeSample();
    sample.files[sampleFileType.XENIUM_CELL_BOUNDARIES].fileObject = makeBlob(
      new Uint8Array([...PARQUET_MAGIC, 1, 2, 3, 0, 0, 0, 0]), // bad tail
    );
    await expect(validateXenium(sample)).rejects.toThrow(/valid Parquet/);
  });

  it('does not mutate the input sample', async () => {
    const sample = makeSample();
    const clone = _.cloneDeep(sample);
    await validateXenium(sample);
    expect(Object.keys(sample.files)).toEqual(Object.keys(clone.files));
  });
});
