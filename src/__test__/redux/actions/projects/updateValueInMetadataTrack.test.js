import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { updateValueInMetadataTrack } from 'redux/actions/projects';

import '__test__/test-utils/setupTests';

import config from 'config';
import { api } from 'utils/constants';
import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED_API_V2 } from 'redux/actionTypes/samples';

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

  it('Works correctly in api v2', async () => {
    config.currentApiVersion = api.V2;

    const store = mockStore();

    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));

    await store.dispatch(
      updateValueInMetadataTrack(experimentId, sampleId, metadataTrackKeyRCompatible, value),
    );

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED_API_V2]);
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

  it('Dispatches error when theres an error updating in api v2', async () => {
    config.currentApiVersion = api.V2;

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
