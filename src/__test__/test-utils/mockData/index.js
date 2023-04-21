import _ from 'lodash';
import generateMockSamples from './generateMockSamples';
import generateMockExperiments from './generateMockExperiments';
import generateMockProcessingConfig from './generateMockProcessingConfig';

// This file is a work in progress to generate mock data for the endpoints of the test.
// The generated data should be usable as response data to be sent via the mocked API in mockAPI.js
// The module should also expose the generated data that can be imported and used easily in tests
// A ticket has been created to give more thought into this https://biomage.atlassian.net/browse/BIOMAGE-1553

const responseData = {};

responseData.experiments = generateMockExperiments(2);

responseData.samples = [generateMockSamples(
  responseData.experiments[0],
  3,
)];

responseData.processingConfig = generateMockProcessingConfig(3);

// Add samples to first experiment
const samples = responseData.samples[0];
const sampleIds = _.map(samples, 'id');
responseData.experiments[0].samplesOrder = sampleIds;

const { experiments, processingConfig } = responseData;

export {
  experiments,
  samples,
  processingConfig,
  responseData,
};
