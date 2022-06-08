import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import createSample from 'redux/actions/samples/createSample';
import initialSampleState from 'redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import endUserMessages from 'utils/endUserMessages';

import {
  SAMPLES_CREATE, SAMPLES_SAVING, SAMPLES_ERROR, SAMPLES_SAVED,
} from 'redux/actionTypes/samples';

import pushNotificationMessage from 'utils/pushNotificationMessage';

import config from 'config';
import { api } from 'utils/constants';

jest.mock('config');

pushNotificationMessage.mockImplementation(() => async () => { });

enableFetchMocks();

const mockStore = configureStore([thunk]);

jest.mock('uuid');
const sampleUuid = 'abc123';
uuidv4.mockImplementation(() => sampleUuid);

const sampleName = 'test sample';

describe('createSample action', () => {
  const projectUuid = 'qwe234';
  const experimentId = 'exp234';

  const mockType = '10X Chromium';

  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: projectUuid,
    experiments: [experimentId],
  };

  const mockExperiment = {
    ...experimentTemplate,
    name: 'Experiment 1',
    id: experimentId,
  };

  const initialState = {
    samples: { ...initialSampleState },
    experiments: {
      ...initialExperimentState,
      [experimentId]: mockExperiment,
    },
    projects: {
      ...initialProjectState,
      ids: [projectUuid],
      [projectUuid]: mockProject,
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

  it('Runs correctly', async () => {
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });
    const newUuid = await store.dispatch(createSample(projectUuid, sampleName, mockType));

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v2/projects/${projectUuid}/${mockProject.experiments[0]}/samples`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);
    expect(actions[1].type).toEqual(SAMPLES_CREATE);

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);
  });

  it('Shows error message and throws an error when there is a fetch error', async () => {
    fetchMock.mockResponse(JSON.stringify({ message: 'error' }), { url: 'mockedUrl', status: 400 });

    let newUuid;

    // Fails with error message we sent in response to fetch
    await expect(async () => {
      newUuid = await store.dispatch(
        createSample(projectUuid, sampleName, mockType),
      );
    }).rejects.toThrow(endUserMessages.ERROR_CREATING_SAMPLE);

    // Sends correct actions
    const actions = store.getActions();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);
    expect(actions[1].type).toEqual(SAMPLES_ERROR);

    // Check no other action was sent
    expect(actions).toHaveLength(2);

    expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_CREATING_SAMPLE);

    // It should not return a uuid
    expect(newUuid).toBeUndefined();
  });

  it('Works correctly for api v2 with one file being uploaded', async () => {
    config.currentApiVersion = api.V2;
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    const newUuid = await store.dispatch(createSample(projectUuid, sampleName, mockType, ['matrix.tsv.gz']));

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v2/experiments/${mockProject.experiments[0]}/samples/${sampleUuid}`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_CREATE, SAMPLES_SAVED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Works correctly for api v2 with many files being uploaded', async () => {
    config.currentApiVersion = api.V2;
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    const newUuid = await store.dispatch(createSample(projectUuid, sampleName, mockType, ['matrix.tsv.gz', 'features.tsv.gz', 'barcodes.tsv.gz']));

    // Returns a new sampleUuid
    expect(newUuid).toEqual(sampleUuid);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v2/experiments/${mockProject.experiments[0]}/samples/${sampleUuid}`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_SAVING, SAMPLES_CREATE, SAMPLES_SAVED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Throws if technology is not identified', async () => {
    config.currentApiVersion = api.V2;
    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    await expect(
      store.dispatch(
        createSample(projectUuid, sampleName, 'unrecognizable type', ['matrix.tsv.gz', 'features.tsv.gz', 'barcodes.tsv.gz']),
      ),
    ).rejects.toThrow('Sample technology unrecognizable type is not recognized');
  });
});
