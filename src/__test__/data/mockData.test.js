import {
  responseData,
  samples,
  projects,
} from '__test__/test-utils/mockData';

describe('Mock response data', () => {
  it('Describes projects response', () => {
    expect(responseData.projects).toMatchSnapshot();
  });

  it('Describes experiment response', () => {
    expect(responseData.experiments).toMatchSnapshot();
  });

  it('Describes samples response', () => {
    expect(responseData.samples).toMatchSnapshot();
  });

  it('Describes experimentData response', () => {
    expect(responseData.experimentData).toMatchSnapshot();
  });
});

describe('Mock data', () => {
  it('Describes samples', () => {
    expect(samples).toMatchSnapshot();
  });

  it('Describes projects', () => {
    expect(projects).toMatchSnapshot();
  });
});
