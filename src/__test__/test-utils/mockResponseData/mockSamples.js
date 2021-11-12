import fake from '__test__/test-utils/constants';

const mockSampleTemplate = (projectId, sampleId, idx) => ({
  metadata: {},
  createdDate: '0000-00-00T00:00:00.000Z',
  species: null,
  name: `Sample ${idx}`,
  files: {
    'matrix.mtx.gz': {
      valid: true,
      path: `${sampleId}/matrix.mtx.gz`,
      upload: {
        amplifyPromise: null,
        progress: 100,
        status: 'uploaded',
      },
      name: 'matrix.mtx.gz',
      compressed: true,
      lastModified: '0000-00-00T00:00:00.000Z',
      bundle: {
        path: `${sampleId}/matrix.mtx.gz`,
      },
      errors: '',
    },
    lastModified: '0000-00-00T00:00:00.000Z',
    'features.tsv.gz': {
      valid: true,
      path: `${sampleId}/features.tsv.gz`,
      upload: {
        amplifyPromise: null,
        progress: 100,
        status: 'uploaded',
      },
      name: 'features.tsv.gz',
      compressed: true,
      lastModified: '0000-00-00T00:00:00.000Z',
      bundle: {
        path: `${sampleId}/features.tsv.gz`,
      },
      errors: '',
    },
    'barcodes.tsv.gz': {
      valid: true,
      path: `${sampleId}/barchodes.tsv.gz`,
      upload: {
        amplifyPromise: null,
        progress: 100,
        status: 'uploaded',
      },
      name: 'barcodes.tsv.gz',
      compressed: true,
      lastModified: '0000-00-00T00:00:00.000Z',
      bundle: {
        path: `${sampleId}/barcodes.tsv.gz`,
      },
      errors: '',
    },
  },
  lastModified: '0000-00-00T00:00:00.000Z',
  type: '10X Chromium',
  complete: false,
  error: false,
  uuid: `${sampleId}`,
  fileNames: [
    'features.tsv.gz',
    'barcodes.tsv.gz',
    'matrix.mtx.gz',
  ],
  projectUuid: `${projectId}`,
});

const generateMockSamples = (projectId, experimentId, numSamples = 3) => {
  const mockSample = {
    experimentId,
    projectUuid: projectId,
    samples: {},
  };

  for (let idx = 0; idx < numSamples; idx += 1) {
    const newSampleId = `${fake.SAMPLE_ID}-${idx}`;
    const mockSampleEntry = mockSampleTemplate(projectId, newSampleId, idx);

    mockSample.samples[newSampleId] = mockSampleEntry;
  }

  return mockSample;
};

export default generateMockSamples;
