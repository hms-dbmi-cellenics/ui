import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import initialProjectState from '../../../../redux/reducers/projects/initialState';
import { saveProject } from '../../../../redux/actions/projects';

jest.mock('localforage');

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
    await store.dispatch(saveProject(mockProject.uuid));

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v1/projects/${mockProject.uuid}`,
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
    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    const store = mockStore(initialState);
    await store.dispatch(saveProject(mockProject.uuid));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
