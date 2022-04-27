import fetchAPI from 'utils/http/fetchAPI';
import config from 'config';

import loadRoles from 'utils/data-management/experimentSharing/loadRoles';
import { api } from 'utils/constants';

jest.mock('utils/http/fetchAPI');

const experimentId = 'mockExperimentId';

describe('loadRoles', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('Uses V1 URL when using API version V1', async () => {
    config.currentApiVersion = api.V1;

    await loadRoles(experimentId);

    const mockCalls = fetchAPI.mock.calls[0][0];

    expect(mockCalls).toMatch('/v1/access/');
  });

  it('Uses V2 URL when using API version V2', async () => {
    config.currentApiVersion = api.V2;

    await loadRoles(experimentId);

    const mockCalls = fetchAPI.mock.calls[0][0];

    expect(mockCalls).toMatch('/v2/access/');
  });
});
