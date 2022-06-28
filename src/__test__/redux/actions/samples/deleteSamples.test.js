import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import deleteSamples from 'redux/actions/samples/deleteSamples';
import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';

import {
  SAMPLES_DELETE, SAMPLES_SAVED, SAMPLES_SAVING, SAMPLES_ERROR,
} from 'redux/actionTypes/samples';

enableFetchMocks();

const mockStore = configureStore([thunk]);

const mockSampleUuid = 'sample-1';
const mockExperimentId = 'experimentId';

const mockSample = {
  ...sampleTemplate,
  name: 'test sample',
  uuid: mockSampleUuid,
  projectUuid: mockExperimentId,
};

const mockProject = {
  ...projectTemplate,
  name: 'test project',
  samples: [mockSampleUuid],
  experiments: [mockExperimentId],
};

const initialState = {
  samples: {
    ...initialSampleState,
    [mockSampleUuid]: mockSample,
  },
  projects: {
    ...initialProjectState,
    ids: [mockExperimentId],
    [mockExperimentId]: mockProject,
  },
};

describe('deleteSamples', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));
  });

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(deleteSamples([mockSampleUuid]));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);

    // Delete sample
    expect(actions[1].type).toEqual(SAMPLES_DELETE);

    // Resolve loading state
    expect(actions[2].type).toEqual(SAMPLES_SAVED);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockExperimentId}/samples/sample-1`,
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      },
    );
  });

  it('Dispatches error correctly if fetch fails', async () => {
    fetchMock.mockReject(new Error('Api error'));

    const store = mockStore(initialState);
    await store.dispatch(deleteSamples([mockSampleUuid]));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);

    // Delete sample
    expect(actions[1].type).toEqual(SAMPLES_ERROR);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockExperimentId}/samples/sample-1`,
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      },
    );
  });
});
