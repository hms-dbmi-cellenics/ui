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
import { NOTIFICATIONS_PUSH_MESSAGE } from '../../../../redux/actionTypes/notifications';

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
      ids: [mocksampleUuid],
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
            ids: [...payload.ids, newSample.uuid],
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
    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    const store = mockStore(initialState);

    try {
      await store.dispatch(saveSamples(mockprojectUuid, newSample));
    } catch (e) {
      expect(e).toBeDefined();
      expect(e).toMatchInlineSnapshot(
        '[Error: Could not connect to the server. Check your internet connection and refresh the page.]',
      );
    }

    const actions = store.getActions();

    // First action sets up saving status
    expect(actions[0].type).toBe(SAMPLES_SAVING);

    // Second state generates error
    expect(actions[1].type).toBe(SAMPLES_ERROR);

    // Thirdd state emits notification
    expect(actions[2].type).toBe(NOTIFICATIONS_PUSH_MESSAGE);
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
