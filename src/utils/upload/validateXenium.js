import SampleValidationError from 'utils/errors/upload/SampleValidationError';
import sampleFileType from 'utils/sampleFileType';

// Xenium uploads are three binary files with well-known magic numbers. These
// files are treated as already-compressed (uploaded as-is, not gzipped), so we
// read their raw bytes directly. We don't parse the full files in the browser —
// the pipeline does that — but a magic-byte check catches the common mistake of
// dragging the wrong file (e.g. a CSV) into a Xenium slot.

// HDF5 signature: the first 8 bytes of every HDF5 file.
// See https://docs.hdfgroup.org/hdf5/develop/_f_m_t3.html (Format Signature)
const HDF5_MAGIC = [0x89, 0x48, 0x44, 0x46, 0x0d, 0x0a, 0x1a, 0x0a];

// Apache Parquet files begin and end with the 4-byte "PAR1" marker.
const PARQUET_MAGIC = [0x50, 0x41, 0x52, 0x31]; // "PAR1"

const errorMessages = {
  missingFiles: (missingFiles) => `Incomplete sample: Sample does not contain "${missingFiles.join('" and "')}" file(s). Please include the file in the sample.`,
  invalidH5: (name) => `Invalid ${name}: file is not a valid HDF5 (.h5) file.`,
  invalidParquet: (name) => `Invalid ${name}: file is not a valid Parquet (.parquet) file.`,
};

const startsWith = (bytes, magic) => magic.every((byte, i) => bytes[i] === byte);

const readBytes = async (fileObject, start, end) => {
  const buffer = await fileObject.slice(start, end).arrayBuffer();
  return new Uint8Array(buffer);
};

const validateSampleCompleteness = (sampleFiles) => {
  const missingFiles = [];

  if (!sampleFiles[sampleFileType.XENIUM_CELL_FEATURE_MATRIX]) missingFiles.push('cell_feature_matrix.h5');
  if (!sampleFiles[sampleFileType.XENIUM_CELLS]) missingFiles.push('cells.parquet');
  if (!sampleFiles[sampleFileType.XENIUM_CELL_BOUNDARIES]) missingFiles.push('cell_boundaries.parquet');
  if (!sampleFiles[sampleFileType.XENIUM_TRANSCRIPTS]) missingFiles.push('transcripts.parquet');

  if (missingFiles.length) {
    throw new SampleValidationError(errorMessages.missingFiles(missingFiles));
  }
};

const validateH5 = async (sampleFiles) => {
  const { fileObject } = sampleFiles[sampleFileType.XENIUM_CELL_FEATURE_MATRIX];

  const head = await readBytes(fileObject, 0, HDF5_MAGIC.length);
  if (!startsWith(head, HDF5_MAGIC)) {
    throw new SampleValidationError(errorMessages.invalidH5('cell_feature_matrix.h5'));
  }
};

const validateParquet = async (sampleFile, name) => {
  const { fileObject } = sampleFile;

  const head = await readBytes(fileObject, 0, PARQUET_MAGIC.length);
  const tail = await readBytes(fileObject, fileObject.size - PARQUET_MAGIC.length, fileObject.size);

  if (!startsWith(head, PARQUET_MAGIC) || !startsWith(tail, PARQUET_MAGIC)) {
    throw new SampleValidationError(errorMessages.invalidParquet(name));
  }
};

const validateXenium = async (sample) => {
  validateSampleCompleteness(sample.files);

  await validateH5(sample.files);
  await validateParquet(sample.files[sampleFileType.XENIUM_CELLS], 'cells.parquet');
  await validateParquet(sample.files[sampleFileType.XENIUM_CELL_BOUNDARIES], 'cell_boundaries.parquet');
  await validateParquet(sample.files[sampleFileType.XENIUM_TRANSCRIPTS], 'transcripts.parquet');
};

export default validateXenium;
