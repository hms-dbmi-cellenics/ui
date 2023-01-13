import _ from 'lodash';

import fake from '__test__/test-utils/constants';

const mockSampleTemplate = (experimentId, sampleId, idx) => ({
  id: sampleId,
  experimentId,
  name: `Mock sample ${idx}`,
  sampleTechnology: '10x',
  createdAt: '2021-12-07 17:36:27.773+00',
  updatedAt: '2021-12-07 17:38:42.036+00',
  metadata: { age: 'BL', timePoint: 'BL' },
  files: {
    matrix10X: {
      uploadStatus: 'uploaded',
      sampleFileType: 'matrix10x',
      size: 1000,
      s3Path: 'testcfd8122f-25af-4f1a-a306-3268d44ed401',
    },
    barcodes10X: {
      uploadStatus: 'uploaded',
      sampleFileType: 'barcodes10x',
      size: 100,
      s3Path: 'testcfd8122f-25af-4f1a-a306-3268d44ed402',
    },
    features10X: {
      uploadStatus: 'uploaded',
      sampleFileType: 'features10x',
      size: 100,
      s3Path: 'testcfd8122f-25af-4f1a-a306-3268d44ed403',
    },
  },
  options: {},
});

const generateMockSamples = (experimentId, numSamples = 3) => {
  const samples = [];

  _.times(numSamples, (idx) => {
    const newSampleId = `${fake.SAMPLE_ID}-${idx}`;
    samples.push(mockSampleTemplate(experimentId, newSampleId, idx));
  });

  return samples;
};

export default generateMockSamples;
