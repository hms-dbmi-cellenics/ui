import {
  responseData,
  samples,
} from '__test__/test-utils/mockData';

describe('Mock response data', () => {
  it('Describes experiment response', () => {
    expect(responseData.experiments).toMatchSnapshot();
  });

  it('Describes samples response', () => {
    expect(responseData.samples).toMatchSnapshot();
  });
});

describe('Mock data', () => {
  it('Describes samples', () => {
    expect(samples).toMatchSnapshot();
  });
});
