import {
  mockProjectsResponse,
  mockExperimentResponse,
  mockExperimentDataResponse,
  mockSamplesResponse,
  samples,
  projectWithSamples,
  projectWithoutSamples,
} from '__test__/test-utils/mockResponseData';

describe('Mock response data', () => {
  it('Describes projects response', () => {
    expect(mockProjectsResponse).toMatchSnapshot();
  });

  it('Describes experiment response', () => {
    expect(mockExperimentResponse).toMatchSnapshot();
  });

  it('Describes samples response', () => {
    expect(mockSamplesResponse).toMatchSnapshot();
  });

  it('Describes experimentData response', () => {
    expect(mockExperimentDataResponse).toMatchSnapshot();
  });
});

describe('Mock data', () => {
  it('Describes samples', () => {
    expect(samples).toMatchSnapshot();
  });

  it('Describes projectWithSamples', () => {
    expect(projectWithSamples).toMatchSnapshot();
  });

  it('Describes projectWithoutSamples', () => {
    expect(projectWithoutSamples).toMatchSnapshot();
  });
});
