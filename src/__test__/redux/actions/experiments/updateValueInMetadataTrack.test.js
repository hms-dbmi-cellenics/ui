import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { updateValueInMetadataTrack } from 'redux/actions/experiments';

import '__test__/test-utils/setupTests';

import { promiseResponse } from '__test__/test-utils/mockAPI';

import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED } from 'redux/actionTypes/samples';
import { BACKEND_STATUS_LOADED, BACKEND_STATUS_LOADING } from 'redux/actionTypes/backendStatus';

const mockStore = configureStore([thunk]);

describe('updateValueInMetadataTrack action', () => {
  const experimentId = 'mockExperimentId';
  const sampleId = 'mockSampleId';
  const metadataTrackKeyRCompatible = 'Track_1';
  const value = 'mockNewValue';

  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore();

    // Mock all api responses
    fetchMock.mockIf(/.*/, () => promiseResponse(JSON.stringify({})));

    await store.dispatch(
      updateValueInMetadataTrack(experimentId, sampleId, metadataTrackKeyRCompatible, value),
    );

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      SAMPLES_SAVING,
      SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
      BACKEND_STATUS_LOADING,
      BACKEND_STATUS_LOADED,
    ]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experimentId}/samples/${sampleId}/metadataTracks/${metadataTrackKeyRCompatible}`,
      {
        body: JSON.stringify({ value }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      },
    );
  });

  it('Dispatches error when theres an error updating', async () => {
    const store = mockStore();

    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Some error')));

    await store.dispatch(
      updateValueInMetadataTrack(experimentId, sampleId, metadataTrackKeyRCompatible, value),
    );

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });
});
