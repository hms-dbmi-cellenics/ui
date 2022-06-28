import _ from 'lodash';
import configureStore from 'redux-mock-store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import thunk from 'redux-thunk';

import updateSample from 'redux/actions/samples/updateSample';
import initialState, { sampleTemplate } from 'redux/reducers/samples/initialState';

import {
  SAMPLES_ERROR, SAMPLES_SAVED, SAMPLES_SAVING, SAMPLES_UPDATE,
} from 'redux/actionTypes/samples';

import config from 'config';
import { api } from 'utils/constants';

const mockStore = configureStore([thunk]);

describe('updateSample action', () => {
  const mockUuid = 'asd123';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockUuid,
  };

  const mockState = {
    samples: {
      ...initialState,
      [mockSample.uuid]: mockSample,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
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
  });

  it('Error handling works', async () => {
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
