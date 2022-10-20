import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import createSample from 'redux/actions/samples/createSample';
import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import 'utils/upload/validate10x';

import {
  SAMPLES_CREATE, SAMPLES_SAVING, SAMPLES_ERROR, SAMPLES_SAVED,
} from 'redux/actionTypes/samples';

import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { sampleTech } from 'utils/constants';

jest.mock('utils/upload/validate10x');
jest.mock('utils/upload/validateRhapsody');
pushNotificationMessage.mockImplementation(() => async () => { });

enableFetchMocks();

const mockStore = configureStore([thunk]);

jest.mock('uuid');
const sampleUuid = 'abc123';
uuidv4.mockImplementation(() => sampleUuid);

const sampleName = 'test sample';
const sample = {};

describe('createSample action', () => {
  const experimentId = 'exp234';

  const mockType = sampleTech['10X'];

  const mockExperiment = {
    ...experimentTemplate,
    name: 'Experiment 1',
    id: experimentId,
    metadataKeys: ['meta-1', 'meta-2'],
  };

  const initialState = {
    samples: { ...initialSampleState },
    experiments: {
      ...initialExperimentState,
      [experimentId]: mockExperiment,
      ids: [mockExperiment.id],
    },
  };

  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());

    fetchMock.resetMocks();
    fetchMock.doMock();

    store = mockStore(initialState);
  });

  it('Works correctly with one file being uploaded', async () => {
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    const newUuid = await store.dispatch(createSample(experimentId, sampleName, sample, mockType, ['matrix.tsv.gz']));

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v2/experiments/${mockExperiment.id}/samples/${sampleUuid}`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_CREATE, SAMPLES_SAVED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Works correctly with many files being uploaded', async () => {
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    const newUuid = await store.dispatch(createSample(experimentId, sampleName, sample, mockType, ['matrix.tsv.gz', 'features.tsv.gz', 'barcodes.tsv.gz']));

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v2/experiments/${mockExperiment.id}/samples/${sampleUuid}`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_CREATE, SAMPLES_SAVED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Throws if the api fails', async () => {
    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Some error')));

    await expect(
      store.dispatch(
        createSample(experimentId, sampleName, sample, mockType, ['matrix.tsv.gz']),
      ),
    ).rejects.toThrow(endUserMessages.ERROR_CREATING_SAMPLE);

    // Sends correct actions
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Throws if technology is not identified', async () => {
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    await expect(
      store.dispatch(
        createSample(experimentId, sampleName, sample, 'unrecognizable type', ['matrix.tsv.gz', 'features.tsv.gz', 'barcodes.tsv.gz']),
      ),
    ).rejects.toThrow('Sample technology unrecognizable type is not recognized');
  });

  it('Works correctly with BDRhapsody file being uploaded', async () => {
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    const newUuid = await store.dispatch(createSample(experimentId, sampleName, sample, sampleTech.RHAPSODY, ['asdasda_Expression_Data.st']));

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v2/experiments/${mockExperiment.id}/samples/${sampleUuid}`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_CREATE, SAMPLES_SAVED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Creates sample with options value that is the same as existing samples', async () => {
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    const existingSampleId = 'mock-sample';
    const mockOptions = { someOption: true, otherOption: false };

    const existingSampleState = {
      ...initialState,
      experiments: {
        ...initialState.experiments,
        [experimentId]: {
          ...initialState.experiments[experimentId],
          sampleIds: [existingSampleId],
        },
      },
      samples: {
        ...initialSampleState,
        [existingSampleId]: {
          ...sampleTemplate,
          options: mockOptions,
        },
      },
    };

    store = mockStore(existingSampleState);

    const newUuid = await store.dispatch(
      createSample(experimentId, sampleName, sample, sampleTech.RHAPSODY, ['asdasda_Expression_Data.st']),
    );

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody } = fetchMockFirstCall[1];

    const payload = JSON.parse(fetchBody);

    expect(payload.options).toEqual(mockOptions);
    expect(payload).toMatchSnapshot();
  });
});
