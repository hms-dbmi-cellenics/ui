import getBackendStatus from '../../../../redux/selectors/backendStatus/getBackendStatus';

import { initialExperimentBackendStatus } from '../../../../redux/reducers/backendStatus/initialState';

describe('getBackendStatus', () => {
  const mockExperimentId = 'testExperimentId';

  const stateMock = {
    [mockExperimentId]: {
      loading: false,
      error: false,
      status: {
        pipeline: {
          status: 'RUNNING',
        },
      },
    },
  };

  it('Shows the stored backend status when it is there', () => {
    expect(getBackendStatus(mockExperimentId)(stateMock)).toEqual(stateMock[mockExperimentId]);
  });

  it('Shows the default initial backend status when it isn\'t there', () => {
    expect(getBackendStatus('notExistingExperimentId')(stateMock)).toEqual(initialExperimentBackendStatus);
  });
});
