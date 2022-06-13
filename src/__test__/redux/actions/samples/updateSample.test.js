import _ from 'lodash';
import configureStore from 'redux-mock-store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import thunk from 'redux-thunk';

import updateSample from 'redux/actions/samples/updateSample';
import initialState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import { saveSamples } from 'redux/actions/samples';

import {
  SAMPLES_ERROR, SAMPLES_SAVED, SAMPLES_SAVING, SAMPLES_UPDATE,
} from 'redux/actionTypes/samples';

import config from 'config';
import { api } from 'utils/constants';

jest.mock('redux/actions/samples/saveSamples');

const mockStore = configureStore([thunk]);

describe('updateSample action', () => {
  const mockUuid = 'asd123';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockUuid,
  };

  const updatedSample = {
    ...mockSample,
    name: 'updated name',
  };

  const mockState = {
    samples: {
      ...initialState,
      [mockSample.uuid]: mockSample,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    saveSamples.mockImplementation(() => async () => { });

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, updatedSample));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(SAMPLES_UPDATE);
  });

  it('Updates the lastModified field', async () => {
    const originalModifiedDate = mockSample.lastModified;
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, updatedSample));

    const { sample } = store.getActions()[0].payload;
    expect(sample.lastModified).not.toEqual(originalModifiedDate);
    expect(_.omit(sample, 'lastModified')).toEqual(_.omit(updatedSample, 'lastModified'));
  });

  it('Dispatches call to save sample', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, updatedSample));

    expect(saveSamples).toHaveBeenCalled();
  });

  it('Dispatches events correctly for api v2', async () => {
    config.currentApiVersion = api.V2;
    fetchMock.mockResponseOnce(() => Promise.resolve(JSON.stringify({})));

    const sampleDiff = {
      name: 'updated name',
    };

    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, sampleDiff));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_SAVED, SAMPLES_UPDATE]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/null/samples/asd123',
      {
        body: JSON.stringify(sampleDiff),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      },
    );

    expect(saveSamples).not.toHaveBeenCalled();
  });

  it('Error handling for api v2 works', async () => {
    config.currentApiVersion = api.V2;

    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Api error')));

    const sampleDiff = {
      name: 'updated name',
    };

    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, sampleDiff));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });
});
