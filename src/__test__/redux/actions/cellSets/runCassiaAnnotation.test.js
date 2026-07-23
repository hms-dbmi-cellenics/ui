import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import runCassiaAnnotation from 'redux/actions/cellSets/runCassiaAnnotation';
import fake from '__test__/test-utils/constants';
import fetchWork from 'utils/work/fetchWork';

jest.mock('utils/work/fetchWork', () => jest.fn(() => ({})));
jest.mock('utils/getTimeoutForWorkerTask', () => jest.fn(() => 100));

const mockStore = configureMockStore([thunk]);
const experimentId = fake.EXPERIMENT_ID;

const newStore = () => mockStore({
  cellSets: { error: false, updatingClustering: false, loading: false },
});

describe('runCassiaAnnotation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends name, species, tissue and additionalInfo to the worker', async () => {
    await newStore().dispatch(
      runCassiaAnnotation(experimentId, 'Human', 'Large Intestine', '3 tumor, 2 normal'),
    );

    expect(fetchWork).toHaveBeenCalledTimes(1);
    const [calledExperimentId, body] = fetchWork.mock.calls[0];
    expect(calledExperimentId).toEqual(experimentId);
    expect(body).toEqual({
      name: 'CASSIAAnnotate',
      species: 'Human',
      tissue: 'Large Intestine',
      additionalInfo: '3 tumor, 2 normal',
    });
  });

  it('defaults additionalInfo to an empty string when omitted', async () => {
    await newStore().dispatch(
      runCassiaAnnotation(experimentId, 'Human', 'Large Intestine'),
    );

    const [, body] = fetchWork.mock.calls[0];
    expect(body.additionalInfo).toBe('');
  });

  it('does not dispatch a request when cell sets are already updating', async () => {
    const store = mockStore({
      cellSets: { error: false, updatingClustering: true, loading: true },
    });

    await store.dispatch(runCassiaAnnotation(experimentId, 'Human', 'Large Intestine'));

    expect(fetchWork).not.toHaveBeenCalled();
  });
});
