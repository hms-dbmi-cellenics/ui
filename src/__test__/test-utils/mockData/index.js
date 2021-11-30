import generateMockExperimentData from './mockExperimentData';
import generateMockProjects from './mockProjects';
import generateMockSamples from './mockSamples';
import generateMockExperiment from './mockExperiment';

// This file is a work in progress to generate mock data for the endpoints of the test.
// The generated data should be usable as response data to be sent via the mocked API in mockAPI.js
// The module should also expose the generated data that can be imported and used easily in tests
// A ticket has been created to give more thought into this https://biomage.atlassian.net/browse/BIOMAGE-1553

const responseData = {};

const projects = generateMockProjects(2);
responseData.projects = projects;

const projectWithSamples = responseData.projects[0];

responseData.samples = [generateMockSamples(
  projectWithSamples.uuid,
  projectWithSamples.experiments[0],
  3,
)];

const { samples } = responseData.samples[0];
const sampleIds = Object.keys(samples);

projectWithSamples.samples = sampleIds;

responseData.experiments = [generateMockExperiment(
  projectWithSamples.uuid,
  projectWithSamples.experiments[0],
  projectWithSamples.experiments[0],
  projectWithSamples.samples,
)];

responseData.experimentData = generateMockExperimentData(
  projectWithSamples.uuid,
  projectWithSamples.experiments[0],
  projectWithSamples.experiments[0],
  projectWithSamples.samples,
);

export {
  projects,
  samples,
  responseData,
};
