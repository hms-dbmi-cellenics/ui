import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import loadPaginatedGeneProperties from 'redux/actions/genes/loadPaginatedGeneProperties';
import getInitialState from 'redux/reducers/genes/getInitialState';

import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';

import {
  GENES_PROPERTIES_LOADING,
  GENES_PROPERTIES_LOADED_PAGINATED,
  GENES_PROPERTIES_ERROR,
} from 'redux/actionTypes/genes';

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true, // this property makes it work
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(() => new Promise((resolve) => { resolve(null); })),
}));

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockStore = configureStore([thunk]);

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

describe('loadPaginatedGeneProperties action', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      .mockImplementation(() => null);
  });

  it('Does not dispatch when some of the properties are already loading', async () => {
    const initialState = getInitialState();
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
    const initialState = getInitialState();
    const store = mockStore({
      genes:
      {
        ...initialState,
      },
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementation(() => Promise.resolve({
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
      }));

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
    expect(loadingAction).toMatchSnapshot();
    expect(loadingAction.type).toEqual(GENES_PROPERTIES_LOADING);

    const loadedAction = store.getActions()[1];
    expect(loadedAction).toMatchSnapshot();
    expect(loadedAction.type).toEqual(GENES_PROPERTIES_LOADED_PAGINATED);

    const dispatchParams = dispatchWorkRequest.mock.calls[0];
    expect(dispatchParams).toMatchSnapshot();
  });

  it('Dispatches appropriately on error condition', async () => {
    const store = mockStore({
      genes:
      {
        ...getInitialState(),
      },
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementation(() => Promise.reject(new Error('random error!')));

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
