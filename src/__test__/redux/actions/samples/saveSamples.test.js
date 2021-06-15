import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import initialProjectState, {
  projectTemplate,
} from '../../../../redux/reducers/projects/initialState';
import initialSampleState, {
  sampleTemplate,
} from '../../../../redux/reducers/samples/initialState';
import { saveSamples } from '../../../../redux/actions/samples';
import {
  SAMPLES_ERROR,
  SAMPLES_SAVED,
  SAMPLES_SAVING,
} from '../../../../redux/actionTypes/samples';
import pushNotificationMessage from '../../../../utils/pushNotificationMessage';

jest.mock('../../../../utils/pushNotificationMessage');

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('saveSamples action', () => {
  const mockprojectUuid = 'project-123';
  const mocksampleUuid = 'sample-123';

  const mockSample = {
    ...sampleTemplate,
    name: 'sample-test',
    projectUuid: mockprojectUuid,
    uuid: mocksampleUuid,
  };

  const mockProject = {
    ...projectTemplate,
    name: 'mockProject',
    description: 'Project',
    uuid: mockprojectUuid,
    experiments: ['experiment-uuid'],
    createdDate: '2021-01-01T00:00:00.000Z',
    lastModified: null,
    samples: [mockSample.uuid],
    lastAnalyzed: null,
  };

  const initialState = {
    projects: {
      ...initialProjectState,
      ids: [mockprojectUuid],
      [mockprojectUuid]: mockProject,
    },
    samples: {
      ...initialSampleState,
      [mocksampleUuid]: mockSample,
    },
  };

  const newSample = {
    ...mockSample,
    uuid: 'sample-2',
    name: 'sample-2',
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches fetch correctly', async () => {
    const store = mockStore(initialState);

    await store.dispatch(saveSamples(mockprojectUuid, newSample));

    const payload = initialState.samples;
    delete payload.meta;

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v1/projects/${mockprojectUuid}/${mockProject.experiments[0]}/samples`,
      {
        body: JSON.stringify({
          projectUuid: mockProject.uuid,
          experimentId: mockProject.experiments[0],
          samples: {
            ...payload,
            [newSample.uuid]: newSample,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      },
    );
  });

  it('Dispatches a notification when fetch fails.', async () => {
    const errorMsg = 'some weird error that happened';

    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: errorMsg }), { status: 400 });

    const store = mockStore(initialState);

    try {
      await store.dispatch(saveSamples(mockprojectUuid, newSample));
    } catch (e) {
      expect(e).toEqual(errorMsg);
    }

    const actions = store.getActions();

    // First action sets up saving status
    expect(actions[0].type).toBe(SAMPLES_SAVING);

    // Second state generates error
    expect(actions[1].type).toBe(SAMPLES_ERROR);

    // Expect there is a notification
    expect(pushNotificationMessage).toHaveBeenCalled();
  });

  it('Dispatches samples pre and post actions correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveSamples(mockprojectUuid, newSample));

    const actions = store.getActions();

    expect(actions.length).toEqual(2);
    expect(actions[0].type).toEqual(SAMPLES_SAVING);
    expect(actions[1].type).toEqual(SAMPLES_SAVED);
    expect(actions).toMatchSnapshot();
  });

  it('Does not dispatch pre and post actions if disabled', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveSamples(mockprojectUuid, newSample, true, false));

    const actions = store.getActions();
    expect(actions.length).toEqual(0);
    expect(actions).toMatchSnapshot();
  });
});
