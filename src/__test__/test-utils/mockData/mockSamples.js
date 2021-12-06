import fake from '__test__/test-utils/constants';

const mockFileEntry = (fileName, sampleId) => ({
  valid: true,
  path: `${sampleId}/${fileName}`,
  upload: {
    amplifyPromise: null,
    progress: 100,
    status: 'uploaded',
  },
  name: fileName,
  compressed: true,
  lastModified: fake.MOCK_DATETIME,
  fileObject: {
    path: `${sampleId}/${fileName}`,
    size: 100,
  },
  errors: '',
});

const mockSampleTemplate = (projectId, sampleId, idx) => {
  const sampleTemplate = {
    metadata: {},
    createdDate: fake.LAST_MODIFIED,
    species: null,
    name: `Sample ${idx}`,
    files: {},
    lastModified: fake.LAST_MODIFIED,
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
  };

  sampleTemplate.fileNames.forEach((fileName) => {
    sampleTemplate.files[fileName] = mockFileEntry(fileName, sampleId);
  });

  return sampleTemplate;
};

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
