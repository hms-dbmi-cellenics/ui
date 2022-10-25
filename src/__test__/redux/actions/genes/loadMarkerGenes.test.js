import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchWork from 'utils/work/fetchWork';
import loadMarkerGenes from 'redux/actions/genes/loadMarkerGenes';
import { MARKER_GENES_ERROR, MARKER_GENES_LOADED, MARKER_GENES_LOADING } from 'redux/actionTypes/genes';
import getInitialState from 'redux/reducers/genes/getInitialState';

import '__test__/test-utils/setupTests';
import { getOneGeneMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

jest.mock('utils/work/fetchWork');

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockStore = configureStore([thunk]);

describe('loadMarkerGenes action', () => {
  const experimentId = '1234';

  const backendStatus = {
    [experimentId]: {
      status: {
        pipeline: {
          status: 'SUCCEEDED',
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    },
  };

  const experimentSettings = {
    processing: {
      configureEmbedding: {
        clusteringSettings: {
          method: 'methodId',
        },
      },
    },
  };

  it('throws when parameters are undefined or null', async () => {
    const store = mockStore({});

    const errorMessage = 'Null or undefined parameter/s for loadMarkerGenes';

    try {
      await store.dispatch(loadMarkerGenes(null, 1));

      // eslint-disable-next-line no-undef
      fail('it should not reach here');
    } catch (e) {
      expect(e.message).toEqual(errorMessage);
    }

    try {
      await store.dispatch(loadMarkerGenes(1, undefined));
      // eslint-disable-next-line no-undef
      fail('it should not reach here');
    } catch (e) {
      expect(e.message).toEqual(errorMessage);
    }

    try {
      await store.dispatch(loadMarkerGenes(1));
      // eslint-disable-next-line no-undef
      fail('it should not reach here');
    } catch (e) {
      expect(e.message).toEqual(errorMessage);
    }
  });

  it('dispatches appropriately on success', async () => {
    const store = mockStore({
      genes: getInitialState(),
      experimentSettings,
      backendStatus,
    });

    const mockResult = getOneGeneMatrix('geneA', 1);

    fetchWork.mockImplementationOnce(() => new Promise((resolve) => resolve(mockResult)));

    await store.dispatch(loadMarkerGenes(experimentId, 10, 'interactiveHeatmap'));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([MARKER_GENES_LOADING, MARKER_GENES_LOADED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('dispatches appropriately on error', async () => {
    const store = mockStore({
      genes: getInitialState(),
      experimentSettings,
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(loadMarkerGenes(experimentId, 10));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([MARKER_GENES_LOADING, MARKER_GENES_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Defaults to louvain cluster if selected cell set is not provided', async () => {
    const store = mockStore({
      genes: getInitialState(),
      experimentSettings,
      backendStatus,
    });

    const defaultCellSetKey = 'louvain';

    const workRequestBody = { cellSetKey: defaultCellSetKey, nGenes: 5, name: 'MarkerHeatmap' };

    await store.dispatch(loadMarkerGenes(experimentId, 10, 'interactiveHearmap', 5));

    expect(fetchWork).toHaveBeenCalled();

    const functionArgs = fetchWork.mock.calls[0];

    expect(functionArgs[1]).toEqual(workRequestBody);
  });
});
