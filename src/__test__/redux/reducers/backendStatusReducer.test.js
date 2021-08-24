import _ from 'lodash';

import backendStatusReducer from '../../../redux/reducers/backendStatus';
import initialState, { initialExperimentBackendStatus } from '../../../redux/reducers/backendStatus/initialState';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_ERROR,
  BACKEND_STATUS_LOADED,
} from '../../../redux/actionTypes/backendStatus';

/* eslint-disable max-len */
describe('backendStatusReducer.test.js', () => {
  const experimentId = '1234';

  it('updates backend status on error properly', () => {
    const newState = backendStatusReducer(initialState,
      {
        type: BACKEND_STATUS_ERROR,
        payload:
        {
          experimentId,
          error: 'error',
        },
      });

    expect(newState[experimentId].error).toEqual('error');

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });

  it('updates backend status on loading properly', () => {
    const newState = backendStatusReducer(initialState,
      { type: BACKEND_STATUS_LOADING, payload: { experimentId } });

    expect(newState[experimentId].loading).toEqual(true);
    expect(newState[experimentId].error).toEqual(false);

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });

  it('updates backend status on loaded properly', () => {
    const initialBackendPipelineStatus = _.cloneDeep(initialState);

    initialBackendPipelineStatus[experimentId] = initialExperimentBackendStatus;

    initialBackendPipelineStatus[experimentId].status.pipeline = { status: 'NotCreated' };

    const newState = backendStatusReducer(initialBackendPipelineStatus,
      {
        type: BACKEND_STATUS_LOADED,
        payload: {
          experimentId,
          status: {
            gem2s: { status: 'Running' },
          },
        },
      });

    // Sets backend load states correctly
    expect(newState[experimentId].loading).toEqual(false);
    expect(newState[experimentId].error).toEqual(false);

    // New state of updated service is there
    expect(newState[experimentId].status.gem2s.status).toEqual('Running');

    // Previous state of another service is still there
    expect(newState[experimentId].status.pipeline.status).toEqual('NotCreated');

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });
});
