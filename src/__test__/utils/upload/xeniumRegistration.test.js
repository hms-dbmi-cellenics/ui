import {
  sampleTech, spatialTechs, imagelessTechs, obj2sTechs,
} from 'utils/constants';
import sampleFileType, { fileTypeToDisplay, fileTypeColumnWidth } from 'utils/sampleFileType';
import fileUploadUtils, { techNamesToDisplay } from 'utils/upload/fileUploadUtils';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';
import validateXenium from 'utils/upload/validateXenium';
import sampleValidators from 'utils/upload/sampleValidators';

// Locks in the Xenium upload registration added in Phase 1. These guard the
// "a new file type touches several coordinated places" gotcha (plan learning 5).
describe('Xenium registration — constants', () => {
  it('registers XENIUM in the sampleTech enum', () => {
    expect(sampleTech.XENIUM).toEqual('xenium');
  });

  it('marks xenium as a spatial technology', () => {
    expect(spatialTechs).toContain(sampleTech.XENIUM);
  });

  it('marks xenium as an imageless technology (no tissue image)', () => {
    expect(imagelessTechs).toContain(sampleTech.XENIUM);
  });

  it('does not treat xenium as an obj2s (pre-processed object) technology', () => {
    expect(obj2sTechs).not.toContain(sampleTech.XENIUM);
  });
});

describe('Xenium registration — sampleFileType', () => {
  const xeniumTypes = [
    [sampleFileType.XENIUM_CELL_FEATURE_MATRIX, 'xenium_cell_feature_matrix', 'cell_feature_matrix.h5'],
    [sampleFileType.XENIUM_CELLS, 'xenium_cells', 'cells.parquet'],
    [sampleFileType.XENIUM_CELL_BOUNDARIES, 'xenium_cell_boundaries', 'cell_boundaries.parquet'],
    [sampleFileType.XENIUM_TRANSCRIPTS, 'xenium_transcripts', 'transcripts.parquet'],
  ];

  it.each(xeniumTypes)('defines the file type constant %s', (constant, expectedValue) => {
    expect(constant).toEqual(expectedValue);
  });

  it.each(xeniumTypes)('maps %s to the on-disk display name %s', (constant, _value, displayName) => {
    expect(fileTypeToDisplay[constant]).toEqual(displayName);
  });

  it.each(xeniumTypes)('defines a column width for %s', (constant) => {
    expect(typeof fileTypeColumnWidth[constant]).toEqual('number');
  });
});

describe('Xenium registration — fileUploadUtils', () => {
  const xeniumOptions = fileUploadUtils[sampleTech.XENIUM];

  it('registers a display name for the technology', () => {
    expect(techNamesToDisplay[sampleTech.XENIUM]).toEqual('Xenium');
  });

  it('is a folder-per-sample spatial count matrix tech', () => {
    expect(xeniumOptions.category).toEqual('SPATIAL - Sample Count Matrices');
    expect(xeniumOptions.webkitdirectory).toEqual('');
  });

  it('accepts the four required Xenium files', () => {
    expect(Array.from(xeniumOptions.acceptedFiles).sort()).toEqual(
      ['cell_boundaries.parquet', 'cell_feature_matrix.h5', 'cells.parquet', 'transcripts.parquet'],
    );
  });

  it('requires the four Xenium file types', () => {
    expect(xeniumOptions.requiredFiles).toEqual([
      sampleFileType.XENIUM_CELL_FEATURE_MATRIX,
      sampleFileType.XENIUM_CELLS,
      sampleFileType.XENIUM_CELL_BOUNDARIES,
      sampleFileType.XENIUM_TRANSCRIPTS,
    ]);
  });

  it.each([
    ['cell_feature_matrix.h5', sampleFileType.XENIUM_CELL_FEATURE_MATRIX],
    ['cells.parquet', sampleFileType.XENIUM_CELLS],
    ['cell_boundaries.parquet', sampleFileType.XENIUM_CELL_BOUNDARIES],
    ['transcripts.parquet', sampleFileType.XENIUM_TRANSCRIPTS],
    ['some/nested/path/cells.parquet', sampleFileType.XENIUM_CELLS],
    ['some/nested/path/transcripts.parquet', sampleFileType.XENIUM_TRANSCRIPTS],
  ])('maps filename %s to file type %s', (fileName, expectedType) => {
    expect(xeniumOptions.getCorrespondingType(fileName)).toEqual(expectedType);
  });

  it('validates accepted file names and rejects others', () => {
    expect(xeniumOptions.isNameValid('cells.parquet')).toBe(true);
    expect(xeniumOptions.isNameValid('cell_feature_matrix.h5')).toBe(true);
    expect(xeniumOptions.isNameValid('transcripts.parquet')).toBe(true);
    expect(xeniumOptions.isNameValid('analysis.csv')).toBe(false);
  });
});

describe('Xenium registration — fileInspector', () => {
  it.each([
    'cell_feature_matrix.h5',
    'cells.parquet',
    'cell_boundaries.parquet',
    'transcripts.parquet',
  ])('treats %s as already-compressed (VALID_ZIPPED, skip gzip)', async (name) => {
    expect(await inspectFile({ name }, sampleTech.XENIUM)).toEqual(Verdict.VALID_ZIPPED);
  });

  it('rejects an unrecognised file name for xenium', async () => {
    expect(await inspectFile({ name: 'analysis.csv' }, sampleTech.XENIUM))
      .toEqual(Verdict.INVALID_NAME);
  });
});

describe('Xenium registration — validator', () => {
  it('uses the Xenium content validator', () => {
    expect(sampleValidators[sampleTech.XENIUM]).toBe(validateXenium);
  });
});
