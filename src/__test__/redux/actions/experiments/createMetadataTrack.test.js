import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import createMetadataTrack from 'redux/actions/experiments/createMetadataTrack';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';

import {
  EXPERIMENTS_METADATA_CREATE,
} from 'redux/actionTypes/experiments';

import { promiseResponse } from '__test__/test-utils/mockAPI';

import { SAMPLES_UPDATE } from 'redux/actionTypes/samples';
import { BACKEND_STATUS_LOADED, BACKEND_STATUS_LOADING } from 'redux/actionTypes/backendStatus';

const mockStore = configureStore([thunk]);

describe('createMetadataTrack action', () => {
  const experiment1Id = 'expeirment-1';
  const sample1uuid = 'sample1';

  const experiment1 = {
    ...experimentTemplate,
    name: 'Experiment 1',
    id: experiment1Id,
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
    sampleIds: [sample1uuid],
  };

  const sample1 = {
    ...sampleTemplate,
    name: 'Sample 1',
    experimentId: experiment1Id,
    uuid: 'sample1',
  };

  const oneExperimentState = {
    experiments: {
      ...initialExperimentState,
      ids: [experiment1.id],
      [experiment1.id]: experiment1,
    },
    samples: {
      ...initialSamplesState,
      [sample1.uuid]: sample1,
    },
  };

  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore(oneExperimentState);

    fetchMock.mockIf(/.*/, () => promiseResponse(JSON.stringify({})));

    await store.dispatch(createMetadataTrack('Test track', experiment1.id));

    const trackKeyRCompatible = 'Test_track';

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      EXPERIMENTS_METADATA_CREATE,
      SAMPLES_UPDATE,
      BACKEND_STATUS_LOADING,
      BACKEND_STATUS_LOADED,
    ]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experiment1.id}/metadataTracks/${trackKeyRCompatible}`,
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    );
  });
});
