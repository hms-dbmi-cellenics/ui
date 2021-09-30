import React from 'react';

import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import preloadAll from 'jest-next-dynamic';
import { Provider, useDispatch } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CellSetsTool, { generateFilteredCellIndices } from '../../../../components/data-exploration/cell-sets-tool/CellSetsTool';
import { makeStore } from '../../../../redux/store';
// import { CELL_SETS_CREATE } from '../../../../redux/actionTypes/cellSets';
import { createCellSet } from '../../../../redux/actions/cellSets';

const cellSetsData = require('../../../data/cell_sets.json');

jest.mock('localforage');

jest.mock('../../../../utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({ emit: jest.fn(), on: jest.fn(), id: '5678' });
  }),
}));

let storeState;
const experimentId = '1234';

describe('CellSetsTool', () => {
  beforeEach(async () => {
    enableFetchMocks();
    await preloadAll();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(cellSetsData));
    storeState = makeStore();
  });

  it('renders correctly cell set tool with no clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // There should be a tab for cell sets
    await screen.getByText(/Cell sets/);

    // // There should be a tab for metadata
    await screen.getByText(/Metadata/i);

    const editButtons = await screen.getAllByLabelText(/Edit/);
    expect(editButtons.length).toEqual(15);

    // There should be no delete buttons.
    const deleteButtons = screen.queryByText(/Delete/);
    expect(deleteButtons).toBeNull();
  });

  it('renders correctly cell set tool with clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // storeState.dispatch({
    //   type: CELL_SETS_CREATE,
    //   payload: {
    //     cellIds: new Set([1070, 5625, 2854, 5093, 2748]),
    //     color: '#3957ff',
    //     experimentId: 'cf6be70f5a9ed32f74ac686f18a0d951',
    //     key: 'f01a7023-3a48-4085-83be-4567211702a4',
    //     name: 'New Cluster',
    //   },
    // });

    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'Ivas Cluster', '#3957ff', new Set([1070, 5625, 2854, 5093, 2748])));
    });

    // There should be a tab for cell sets
    await screen.getByText(/Cell sets/);

    // // There should be a tab for metadata
    await screen.getByText(/Metadata/);

    // There should be delete buttons for clusters under Custom cell sets.
    const deleteButtons = await screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);
  });

  it('cell set operations should not render when no cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
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

  // it('cell set operations should render when cell sets are selected', async () => {
  //   const store = mockStore(
  //     {
  //       ...storeState,
  //       cellSets: {
  //         ...storeState.cellSets,
  //         selected: { ...storeState.cellSets.selected, cellSets: ['cluster-a'] },
  //       },
  //     },
  //   );

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   const cellSetOperations = await screen.getAllByLabelText(/of selected$/i);

  //   // There should be three operations rendered.
  //   expect(cellSetOperations.length).toEqual(3);
  // });

  // it('cell set operations should work appropriately for unions', async () => {
  //   const store = mockStore(
  //     {
  //       ...storeState,
  //       cellSets: {
  //         ...storeState.cellSets,
  //         selected: { ...storeState.cellSets.selected, cellSets: ['cluster-a', 'cluster-b', 'cluster-c'] },
  //       },
  //     },
  //   );

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   const unionOperation = await screen.getByLabelText(/Union of selected$/i);
  //   await fireEvent(
  //     unionOperation,
  //     new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //     }),
  //   );

  //   const saveButton = await screen.getByLabelText(/Save/i);
  //   await fireEvent(
  //     saveButton,
  //     new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //     }),
  //   );

  //   // Should create the appropriate union set.
  //   const lastAction = store.getActions().length - 1;
  //   const createAction = store.getActions()[lastAction];
  //   expect(createAction.payload.cellIds).toEqual(new Set([1, 2, 3, 4, 5]));
  // });

  // it('cell set operations should work appropriately for intersections', async () => {
  //   const store = mockStore(
  //     {
  //       ...storeState,
  //       cellSets: {
  //         ...storeState.cellSets,
  //         selected: { ...storeState.cellSets.selected, cellSets: ['cluster-a', 'cluster-b', 'cluster-c'] },
  //       },
  //     },
  //   );

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   const unionOperation = await screen.getByLabelText(/Intersection of selected$/i);
  //   await fireEvent(
  //     unionOperation,
  //     new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //     }),
  //   );

  //   const saveButton = await screen.getByLabelText(/Save/i);
  //   await fireEvent(
  //     saveButton,
  //     new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //     }),
  //   );

  //   // Should create the appropriate union set.
  //   const lastAction = store.getActions().length - 1;
  //   const createAction = store.getActions()[lastAction];
  //   expect(createAction.payload.cellIds).toEqual(new Set([2]));
  // });

  // it('cell set operations should work appropriately for complement', async () => {
  //   const store = mockStore(
  //     {
  //       ...storeState,
  //       cellSets: {
  //         ...storeState.cellSets,
  //         selected: { ...storeState.cellSets.selected, cellSets: ['scratchpad-a', 'cluster-c'] },
  //       },
  //     },
  //   );

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   const unionOperation = await screen.getByLabelText(/Complement of selected$/i);
  //   await fireEvent(
  //     unionOperation,
  //     new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //     }),
  //   );

  //   const saveButton = await screen.getByLabelText(/Save/i);

  //   await fireEvent(
  //     saveButton,
  //     new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //     }),
  //   );

  //   // Should create the appropriate union set.
  //   const lastAction = store.getActions().length - 1;
  //   const createAction = store.getActions()[lastAction];
  //   expect(createAction.payload.cellIds).toEqual(new Set([1, 4]));
  // });

  // it('selected cell sets show selected in both tabs', async () => {
  //   const store = mockStore(
  //     {
  //       ...storeState,
  //       cellSets: {
  //         ...storeState.cellSets,
  //         selected: {
  //           cellSets: ['scratchpad-a', 'cluster-c'],
  //           metadataCategorical: ['cluster-b'],
  //         },
  //       },
  //     },
  //   );

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   await screen.getByText(/3 cells selected/i);

  //   const metadataTabButton = await screen.getByText(/Metadata/i);

  //   await act(async () => {
  //     await fireEvent(
  //       metadataTabButton,
  //       new MouseEvent('click', {
  //         bubbles: true,
  //         cancelable: true,
  //       }),
  //     );
  //   });

  //   await screen.getByText(/4 cells selected/i);

  //   const cellSetTabButton = await screen.getByText(/Cell sets/i);

  //   await act(async () => {
  //     await fireEvent(
  //       cellSetTabButton,
  //       new MouseEvent('click', {
  //         bubbles: true,
  //         cancelable: true,
  //       }),
  //     );
  //   });

  //   await screen.getByText(/3 cells selected/i);
  // });

  // it('Scratchpad cluster deletion works ', async () => {
  //   const store = mockStore(storeState);

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   // There should be a delete button for the scratchpad cluster.
  //   const deleteButtons = await screen.getAllByLabelText(/Delete/i);
  //   expect(deleteButtons.length).toEqual(2);

  //   // Clicking on one of the buttons...
  //   await act(async () => {
  //     await fireEvent(
  //       deleteButtons[0],
  //       new MouseEvent('click', {
  //         bubbles: true,
  //         cancelable: true,
  //       }),
  //     );
  //   });

  //   // ... should trigger a delete
  //   const deleteActionCount = store.getActions().filter(
  //     (action) => action.type.includes('delete'),
  //   ).length;

  //   expect(deleteActionCount).toEqual(1);
  // });

  // it('shows an accurate cell count when all cell sets selected', async () => {
  //   const store = mockStore(
  //     {
  //       ...storeState,
  //       cellSets: {
  //         ...storeState.cellSets,
  //         selected: {
  //           cellSets: ['cluster-a', 'cluster-b', 'cluster-c'],
  //           metadataCategorical: ['sample-a'],
  //         },
  //       },
  //     },
  //   );

  //   await act(async () => {
  //     render(
  //       <Provider store={store}>
  //         <CellSetsTool
  //           experimentId='1234'
  //           width={50}
  //           height={50}
  //         />
  //       </Provider>,
  //     );
  //   });

  //   await screen.getByText(/5 cells selected/i);

  //   const metadataTabButton = await screen.getByText(/Metadata/i);

  //   await act(async () => {
  //     await fireEvent(
  //       metadataTabButton,
  //       new MouseEvent('click', {
  //         bubbles: true,
  //         cancelable: true,
  //       }),
  //     );
  //   });

  //   await screen.getByText(/5 cells selected/i);

  //   const cellSetTabButton = await screen.getByText(/Cell sets/i);

  //   await act(async () => {
  //     await fireEvent(
  //       cellSetTabButton,
  //       new MouseEvent('click', {
  //         bubbles: true,
  //         cancelable: true,
  //       }),
  //     );
  //   });

  //   await screen.getByText(/5 cells selected/i);
  // });

  // it('calculates filtered cell indices correctly', () => {
  //   expect(generateFilteredCellIndices(storeState.genes.expression.data))
  //     .toEqual(new Set([0]));
  // });
});
