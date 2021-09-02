import React from 'react';

import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CellSetsTool, { generateFilteredCellIndices } from '../../../../components/data-exploration/cell-sets-tool/CellSetsTool';

jest.mock('localforage');

jest.mock('../../../../utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({ emit: jest.fn(), on: jest.fn(), id: '5678' });
  }),
}));

const mockStore = configureStore([thunk]);

describe('CellSetsTool', () => {
  const storeState = {
    cellInfo: {
      focus: { store: null, key: null },
    },
    cellSets: {
      loading: false,
      error: false,
      properties: {
        'cluster-a': {
          name: 'cluster a',
          key: 'cluster-a',
          cellIds: new Set([1, 2]),
          color: '#00FF00',
        },
        'cluster-b': {
          name: 'cluster b',
          key: 'cluster-b',
          cellIds: new Set([2, 3, 4, 5]),
          color: '#FF0000',
        },
        'cluster-c': {
          name: 'cluster c',
          key: 'cluster-c',
          cellIds: new Set([2, 5]),
          color: '#0000FF',
        },
        'scratchpad-a': {
          cellIds: new Set([3]),
          key: 'scratchpad-a',
          name: 'New Cluster',
          color: '#ff00ff',
        },
        'sample-a': {
          cellIds: new Set([1, 2, 3, 4, 5]),
          name: 'Sample A',
          key: 'sample-a',
          color: '#e377c2',
        },

        louvain: {
          cellIds: new Set(),
          name: 'Louvain clusters',
          key: 'louvain',
          type: 'cellSets',
          rootNode: true,
        },
        scratchpad: {
          cellIds: new Set(),
          name: 'Custom selections',
          key: 'scratchpad',
          type: 'cellSets',
          rootNode: true,
        },
        sample: {
          cellIds: new Set(),
          name: 'Samples',
          key: 'sample',
          type: 'metadataCategorical',
          rootNode: true,
        },
      },
      hierarchy: [
        {
          key: 'louvain',
          children: [{ key: 'cluster-a' }, { key: 'cluster-b' }, { key: 'cluster-c' }],
        },
        {
          key: 'scratchpad',
          children: [{ key: 'scratchpad-a' }],
        },
        {
          key: 'sample',
          children: [{ key: 'sample-a' }],
        },
      ],
      hidden: new Set(),
      selected: [],
    },
    genes: {
      expression: {
        loading: [],
        data: {
          Lyz2: {
            rawExpression: {
              // index 0 is null, so filtered, this index is also not included
              // in any clusters for this reason
              expression: [null, 1, 2, 3, 4, 5],
            },
          },
        },
      },
      properties: {
        data: {
          Lyz2: {},
        },
      },
    },
  };

  beforeAll(async () => {
    enableFetchMocks();
    await preloadAll();
  });

  beforeEach(() => {
    const response = new Response(JSON.stringify({ one: 'one' }));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('renders correctly', async () => {
    await act(async () => {
      render(
        <Provider store={mockStore(storeState)}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // There should be a tab for cell sets
    await screen.getByText(/Cell sets/i);

    // There should be a tab for metadata
    await screen.getByText(/Metadata/i);

    // There should be a delete button for the scratchpad cluster.
    const deleteButtons = await screen.getAllByLabelText(/Delete/i);
    expect(deleteButtons.length).toEqual(2);
  });

  it('cell set operations should not render when no cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={mockStore(storeState)}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    const cellSetOperations = await screen.queryByLabelText(/of selected$/i);

    // There should be no operations rendered
    expect(cellSetOperations).toEqual(null);
  });

  it('cell set operations should render when cell sets are selected', async () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: { ...storeState.cellSets.selected, cellSets: ['cluster-a'] },
        },
      },
    );

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    const cellSetOperations = await screen.getAllByLabelText(/of selected$/i);

    // There should be three operations rendered.
    expect(cellSetOperations.length).toEqual(3);
  });

  it('cell set operations should work appropriately for unions', async () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: { ...storeState.cellSets.selected, cellSets: ['cluster-a', 'cluster-b', 'cluster-c'] },
        },
      },
    );

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    const unionOperation = await screen.getByLabelText(/Union of selected$/i);
    await fireEvent(
      unionOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const saveButton = await screen.getByLabelText(/Save/i);
    await fireEvent(
      saveButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    // Should create the appropriate union set.
    const lastAction = store.getActions().length - 1;
    const createAction = store.getActions()[lastAction];
    expect(createAction.payload.cellIds).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it('cell set operations should work appropriately for intersections', async () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: { ...storeState.cellSets.selected, cellSets: ['cluster-a', 'cluster-b', 'cluster-c'] },
        },
      },
    );

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    const unionOperation = await screen.getByLabelText(/Intersection of selected$/i);
    await fireEvent(
      unionOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const saveButton = await screen.getByLabelText(/Save/i);
    await fireEvent(
      saveButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    // Should create the appropriate union set.
    const lastAction = store.getActions().length - 1;
    const createAction = store.getActions()[lastAction];
    expect(createAction.payload.cellIds).toEqual(new Set([2]));
  });

  it('cell set operations should work appropriately for complement', async () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: { ...storeState.cellSets.selected, cellSets: ['scratchpad-a', 'cluster-c'] },
        },
      },
    );

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    const unionOperation = await screen.getByLabelText(/Complement of selected$/i);
    await fireEvent(
      unionOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const saveButton = await screen.getByLabelText(/Save/i);

    await fireEvent(
      saveButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    // Should create the appropriate union set.
    const lastAction = store.getActions().length - 1;
    const createAction = store.getActions()[lastAction];
    expect(createAction.payload.cellIds).toEqual(new Set([1, 4]));
  });

  it('selected cell sets show selected in both tabs', async () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: {
            cellSets: ['scratchpad-a', 'cluster-c'],
            metadataCategorical: ['cluster-b'],
          },
        },
      },
    );

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    await screen.getByText(/3 cells selected/i);

    const metadataTabButton = await screen.getByText(/Metadata/i);

    await act(async () => {
      await fireEvent(
        metadataTabButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await screen.getByText(/4 cells selected/i);

    const cellSetTabButton = await screen.getByText(/Cell sets/i);

    await act(async () => {
      await fireEvent(
        cellSetTabButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await screen.getByText(/3 cells selected/i);
  });

  it('Scratchpad cluster deletion works ', async () => {
    const store = mockStore(storeState);

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // There should be a delete button for the scratchpad cluster.
    const deleteButtons = await screen.getAllByLabelText(/Delete/i);
    expect(deleteButtons.length).toEqual(2);

    // Clicking on one of the buttons...
    await act(async () => {
      await fireEvent(
        deleteButtons[0],
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // ... should trigger a delete
    const deleteActionCount = store.getActions().filter(
      (action) => action.type.includes('delete'),
    ).length;

    expect(deleteActionCount).toEqual(1);
  });

  it('shows an accurate cell count when all cell sets selected', async () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: {
            cellSets: ['cluster-a', 'cluster-b', 'cluster-c'],
            metadataCategorical: ['sample-a'],
          },
        },
      },
    );

    await act(async () => {
      render(
        <Provider store={store}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    await screen.getByText(/5 cells selected/i);

    const metadataTabButton = await screen.getByText(/Metadata/i);

    await act(async () => {
      await fireEvent(
        metadataTabButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await screen.getByText(/5 cells selected/i);

    const cellSetTabButton = await screen.getByText(/Cell sets/i);

    await act(async () => {
      await fireEvent(
        cellSetTabButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await screen.getByText(/5 cells selected/i);
  });

  it('calculates filtered cell indices correctly', () => {
    expect(generateFilteredCellIndices(storeState.genes.expression.data))
      .toEqual(new Set([0]));
  });
});
