import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import { saveSamples } from '../../../../redux/actions/samples';
import { SAMPLES_SAVED, SAMPLES_SAVING } from '../../../../redux/actionTypes/samples';

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
    const response = new Response(JSON.stringify({ one: 'one' }));

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
    await store.dispatch(saveSamples(mockprojectUuid, newSample));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches project guards correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveSamples(mockprojectUuid, newSample));

    const actions = store.getActions();
    expect(actions.length).toEqual(2);
    expect(actions[0].type).toEqual(SAMPLES_SAVING);
    expect(actions[1].type).toEqual(SAMPLES_SAVED);
  });

  it('Does not dispatch guards if disabled', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveSamples(mockprojectUuid, newSample, true, false));

    const actions = store.getActions();
    expect(actions.length).toEqual(0);
  });
});
