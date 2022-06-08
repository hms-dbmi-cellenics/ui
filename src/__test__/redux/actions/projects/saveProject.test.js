import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import initialProjectState from 'redux/reducers/projects/initialState';
import { saveProject } from 'redux/actions/projects';
import {
  PROJECTS_ERROR,
  PROJECTS_SAVED,
  PROJECTS_SAVING,
} from 'redux/actionTypes/projects';
import '__test__/test-utils/setupTests';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('saveProject action', () => {
  const mockProject = {
    name: 'mockProject',
    description: 'Project',
    uuid: 'project-uuid',
    createdDate: '2021-01-01T00:00:00.000Z',
    lastModified: null,
    samples: [],
    lastAnalyzed: null,
  };

  const initialState = {
    projects: {
      ...initialProjectState,
      ids: [mockProject.uuid],
      meta: {
        activeprojectUuid: null,
      },
      [mockProject.uuid]: mockProject,
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({ one: 'one' }));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches fetch correctly.', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveProject(mockProject.uuid, mockProject));

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/projects/${mockProject.uuid}`,
      {
        body: JSON.stringify(mockProject),
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
      await store.dispatch(saveProject(mockProject.uuid, mockProject));
    } catch (e) {
      expect(e.statusCode).toEqual(400);
    }

    const actions = store.getActions();

    // First action sets up saving status
    expect(actions[0].type).toBe(PROJECTS_SAVING);

    // Second state saves error
    expect(actions[1].type).toBe(PROJECTS_ERROR);

    // Expect notification to be fired
    expect(pushNotificationMessage).toHaveBeenCalled();

    expect(actions).toMatchSnapshot();
  });

  it('Dispatches project pre and post actions correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveProject(mockProject.uuid, mockProject));

    const actions = store.getActions();

    expect(actions.length).toEqual(2);
    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_SAVED);

    expect(actions).toMatchSnapshot();
  });

  it('Does not dispatch pre and post actions if disabled', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveProject(mockProject.uuid, mockProject, false));

    const actions = store.getActions();
    expect(actions.length).toEqual(0);

    expect(actions).toMatchSnapshot();
  });
});
