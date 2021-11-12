import generateMockExperimentData from './mockExperimentData';
import generateMockProjects from './mockProjects';
import generateMockSamples from './mockSamples';
import generateMockExperiment from './mockExperiment';

const mockProjectsResponse = generateMockProjects(2);

const projectWithSamples = mockProjectsResponse[0];
const projectWithoutSamples = mockProjectsResponse[1];

const mockSamplesResponse = [generateMockSamples(
  projectWithSamples.uuid,
  projectWithSamples.experiments[0],
  3,
)];
const { samples } = mockSamplesResponse[0];
const sampleIds = Object.keys(samples);

projectWithSamples.samples = sampleIds;

const mockExperimentResponse = generateMockExperiment(
  projectWithSamples.uuid,
  projectWithSamples.experiments[0],
  projectWithSamples.experiments[0],
  projectWithSamples.samples,
);

const mockExperimentDataResponse = generateMockExperimentData(
  projectWithSamples.uuid,
  projectWithSamples.experiments[0],
  projectWithSamples.experiments[0],
  projectWithSamples.samples,
);

export {
  mockExperimentResponse,
  mockProjectsResponse,
  mockSamplesResponse,
  mockExperimentDataResponse,
  projectWithSamples,
  projectWithoutSamples,
  samples,
};
