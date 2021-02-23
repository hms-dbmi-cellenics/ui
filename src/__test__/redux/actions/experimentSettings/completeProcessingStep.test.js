import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import completeProcessingStep from '../../../../redux/actions/experimentSettings/completeProcessingStep';
import initialState from '../../../../redux/reducers/experimentSettings/initialState';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('completeProcessingStep', () => {
  const experimentId = '1234';
  const settingName = 'cellSizeDistribution';
  const numSteps = 1;

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches action on completing a step', async () => {
    const store = mockStore({ experimentSettings: { ...initialState } });
    await store.dispatch(completeProcessingStep(experimentId, settingName, numSteps));
    expect(store.getActions().length).toEqual(1);
  });
});
