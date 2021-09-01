import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import loadPaginatedGeneProperties from '../../../../redux/actions/genes/loadPaginatedGeneProperties';
import initialState from '../../../../redux/reducers/genes/initialState';

import sendWork from '../../../../utils/sendWork';

import {
  GENES_PROPERTIES_LOADING,
  GENES_PROPERTIES_LOADED_PAGINATED,
  GENES_PROPERTIES_ERROR,
} from '../../../../redux/actionTypes/genes';

jest.mock('localforage');
jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
}));

jest.mock('../../../../utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockStore = configureStore([thunk]);

describe('loadPaginatedGeneProperties action', () => {
  const experimentId = '1234';
  const properties = ['a', 'b', 'c'];
  const componentUuid = 'asd';

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

  it('Does not dispatch when some of the properties are already loading', async () => {
    const store = mockStore({
      backendStatus,
      genes:
      {
        ...initialState,
        properties: {
          ...initialState.properties,
          loading: ['b'],
        },
      },
    });

    store.dispatch(loadPaginatedGeneProperties(experimentId, properties, componentUuid, {}));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches appropriately on success condition', async () => {
    const store = mockStore({
      genes:
      {
        ...initialState,
      },
      backendStatus,
    });

    sendWork.mockImplementation(() => {
      // No need to mock the result accurately.

      const resolveWith = {
        results:
          [
            {
              body: JSON.stringify({
                total: 2,
                rows: [
                  {
                    gene_names: 'a',
                    dispersions: 1,
                  },
                  {
                    gene_names: 'b',
                    dispersions: 1,
                  },
                ],
              }),
            },
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    const tableState = {
      sorter: {
        field: 'gene_names',
        order: 'ascend',
      },
      pagination: {
        current: 2,
        pageSize: 20,
      },
    };

    await store.dispatch(
      loadPaginatedGeneProperties(experimentId, properties, componentUuid, tableState),
    );

    expect(sendWork).toMatchSnapshot();

    expect(store.getActions().length).toEqual(2);

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_PROPERTIES_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(GENES_PROPERTIES_LOADED_PAGINATED);
    expect(loadedAction).toMatchSnapshot();
  });

  it('Dispatches appropriately on error condition', async () => {
    const store = mockStore({
      genes:
      {
        ...initialState,
      },
      backendStatus,
    });

    sendWork.mockImplementation(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    const tableState = {
      sorter: {
        field: 'gene_names',
        order: 'ascend',
      },
      pagination: {
        current: 2,
        pageSize: 20,
      },
    };

    await store.dispatch(
      loadPaginatedGeneProperties(experimentId, properties, componentUuid, tableState),
    );

    expect(store.getActions().length).toEqual(2);

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_PROPERTIES_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(GENES_PROPERTIES_ERROR);
    expect(loadedAction).toMatchSnapshot();
  });
});
