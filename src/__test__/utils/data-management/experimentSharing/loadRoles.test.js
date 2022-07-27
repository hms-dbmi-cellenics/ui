import fetchAPI from 'utils/http/fetchAPI';

import loadRoles from 'utils/data-management/experimentSharing/loadRoles';

jest.mock('utils/http/fetchAPI');

const experimentId = 'mockExperimentId';

describe('loadRoles', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('Works correctly', async () => {
    await loadRoles(experimentId);

    const mockCalls = fetchAPI.mock.calls[0][0];

    expect(mockCalls).toMatch('/v2/access/');
  });
});
