import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import createSample from 'redux/actions/samples/createSample';
import initialSampleState from 'redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import { SAMPLES_CREATE, SAMPLES_SAVING, SAMPLES_ERROR } from 'redux/actionTypes/samples';
import updateExperiment from 'redux/actions/experiments/updateExperiment';

import pushNotificationMessage from 'utils/pushNotificationMessage';

jest.mock('../../../../redux/actions/experiments/updateExperiment');
updateExperiment.mockImplementation(() => async () => { });

jest.mock('../../../../utils/pushNotificationMessage');
pushNotificationMessage.mockImplementation(() => async () => { });

jest.mock('localforage');

enableFetchMocks();

const mockStore = configureStore([thunk]);

jest.mock('uuid');
const sampleUuid = 'abc123';
uuidv4.mockImplementation(() => sampleUuid);

const sampleName = 'test sample';

describe('createSample action', () => {
  const projectUuid = 'qwe234';
  const experimentId = 'exp234';

  const mockType = '10x Chromium';

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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Runs correctly', async () => {
    const store = mockStore(initialState);

    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    await store.dispatch(createSample(projectUuid, sampleName, mockType));

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v1/projects/${projectUuid}/${mockProject.experiments[0]}/samples`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    // Sends correct actions
    const actions = store.getActions();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);
    expect(actions[1].type).toEqual(SAMPLES_CREATE);

    // Calls update experiment on success of fetch
    expect(updateExperiment).toHaveBeenCalledWith(experimentId, { sampleIds: [sampleUuid] });
  });

  it('Shows error message when there was a fetch error', async () => {
    const store = mockStore(initialState);

    const fetchErrorMessage = 'someFetchError';

    fetchMock.mockResponse(JSON.stringify({ message: fetchErrorMessage }), { url: 'mockedUrl', status: 400 });

    // Fails with error message we sent in response to fetch
    await expect(
      store.dispatch(
        createSample(projectUuid, sampleName, mockType),
      ),
    ).rejects.toEqual(fetchErrorMessage);

    // Sends correct actions
    const actions = store.getActions();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);
    expect(actions[1].type).toEqual(SAMPLES_ERROR);

    expect(pushNotificationMessage).toHaveBeenCalledWith('error', fetchErrorMessage);
  });
});
