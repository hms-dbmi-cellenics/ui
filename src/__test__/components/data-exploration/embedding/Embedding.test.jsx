import React from 'react';
import {
  Provider,
} from 'react-redux';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import Embedding from 'components/data-exploration/embedding/Embedding';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import { CELL_SETS_CREATE } from 'redux/actionTypes/cellSets';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import { CELL_INFO_UPDATE } from 'redux/actionTypes/cellInfo';
import '__test__/test-utils/setupTests';
import { getTwoGenesExpressionMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';
import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';

const mockStore = configureMockStore([thunk]);
let component;
let store;

const width = 100;
const height = 200;

const initialExperimentState = generateExperimentSettingsMock([]);

let vitesscePropsSpy = null;
jest.mock('next/dynamic', () => () => (props) => {
  vitesscePropsSpy = props;
  return 'Sup Im an embedding';
});

describe('Embedding', () => {
  const initialState = {
    embeddings: {
      [initialExperimentState.processing.configureEmbedding.embeddingSettings.method]: {
        ...initialEmbeddingState,
        loading: false,
        data: [[-13, 32], [6, 7], [43, 9], [57, 3]],
      },
    },
    cellSets: {
      properties: {
        louvain: {
          name: 'Louvain clusters',
          color: undefined,
        },
        cluster1: {
          color: '#ff0000',
          cellIds: new Set([2, 3]),
        },
      },
      hierarchy: [
        {
          key: 'louvain',
          children: [{ key: 'cluster1' }],
        },
      ],
      hidden: new Set(),
    },
    genes: {
      expression: {
        full: {
          loading: false,
          matrix: new ExpressionMatrix(),
        },
      },
    },
    cellInfo: {
      cellId: 2,
      focus: {
        store: 'cellSets',
        key: 'louvain',
      },
    },
    experimentSettings: {
      ...initialExperimentState,
    },
  };

  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    // Clears the database and adds some testing data.
    store = mockStore(initialState);

    vitesscePropsSpy = null;

    component = mount(
      <Provider store={store}>
        <Embedding experimentId='1234' width={width} height={height} />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  it('renders correctly a PCA embedding', () => {
    const scatterplot = component.find('Embedding');
    expect(scatterplot.length).toEqual(1);
    expect(vitesscePropsSpy.cellColors).toEqual(
      new Map(
        Object.entries({
          // cell #2 and #3 are in louvain which is currently in focus. They should be red.
          2: [255, 0, 0],
          3: [255, 0, 0],
        }),
      ),

    );
    // cell info is not rendered when there is no cell information
    expect(component.find(CellInfo).length).toEqual(0);

    expect(vitesscePropsSpy.obsEmbedding).toEqual(
      {
        data: [[-13, 6, 43, 57], [32, 7, 9, 3]],
        shape: [2, 4],
      },
    );
    expect(vitesscePropsSpy.obsEmbeddingIndex).toEqual(['0', '1', '2', '3']);
  });

  it('renders correctly a popover on lasso selection and closes it on cancel', () => {
    expect(component.find('ClusterPopover').length).toEqual(0);

    const selectedCellIds = new Set([1, 2]);
    // lasso select cells 1 and 2
    act(() => {
      vitesscePropsSpy.setCellSelection(selectedCellIds);
    });
    component.update();
    let popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(1);

    // close the popover
    act(() => {
      popover.getElement().props.onCancel();
    });
    component.update();
    popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(0);
    expect(store.getActions().length).toEqual(0);
  });

  it('does not render the popover after lasso selection of 0 cells', () => {
    const selectedCellIds = new Set();

    // lasso select cells 1 and 2
    act(() => {
      vitesscePropsSpy.setCellSelection(selectedCellIds);
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(0);
  });

  it('does not render cell info and crosshair when the popover is open', () => {
    // lasso select cells 1 and 2
    const selectedCellIds = new Set([1, 2]);
    act(() => {
      vitesscePropsSpy.setCellSelection(selectedCellIds);
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(1);
    expect(component.find(CrossHair).length).toEqual(0);
    expect(component.find(CellInfo).length).toEqual(0);
  });

  it('renders correctly a popover on lasso selection and creates a new cluster on create', () => {
    expect(component.find('ClusterPopover').length).toEqual(0);

    // lasso select cells 1 and 2
    const selectedCellIds = new Set([1, 2]);
    act(() => {
      vitesscePropsSpy.setCellSelection(selectedCellIds);
    });
    component.update();
    const popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(1);

    // click create in the popover
    act(() => {
      popover.getElement().props.onCreate();
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(0);
    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(CELL_SETS_CREATE);
    expect(store.getActions()[0].payload.cellIds).toEqual(selectedCellIds);
  });

  it('dispatches an action with updated cell information on hover', () => {
    // hover over cells
    act(() => {
      vitesscePropsSpy.setCellHighlight(1);
    });

    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(CELL_INFO_UPDATE);
    expect(store.getActions()[0].payload.cellId).toEqual(1);
  });

  it('renders CrossHair and CellInfo components when user hovers over cell', () => {
    store = mockStore(initialState);

    const mockProjectFromId = jest.fn((cellId) => store.getState().embeddings.umap.data[cellId]);

    const cellCoordinates = {
      projectFromId: mockProjectFromId,
    };

    // hover over cells
    act(() => {
      component.find('div.vitessce-container').simulate('mouseMove');
      vitesscePropsSpy.updateViewInfo(cellCoordinates);
    });

    component.update();

    const crossHairs = component.find(CrossHair);
    const cellInfo = component.find(CellInfo);

    expect(mockProjectFromId).toHaveBeenCalledTimes(1);
    expect(mockProjectFromId).toHaveBeenCalledWith(store.getState().cellInfo.cellId);
    expect(crossHairs.length).toEqual(1);
    expect(crossHairs.props().coordinates.current).toEqual(
      {
        x: store.getState().embeddings.umap.data[2][0],
        y: store.getState().embeddings.umap.data[2][1],
        width,
        height,
      },
    );
    expect(cellInfo.length).toEqual(1);
    expect(crossHairs.props().coordinates.current).toEqual(crossHairs.props().coordinates.current);
  });

  it('does not render CrossHair and CellInfo components when user zooms in or out of the embedding', () => {
    store = mockStore(initialState);

    const mockProjectFromId = jest.fn((cellId) => store.getState().embeddings.umap.data[cellId]);

    const cellCoordinates = {
      projectFromId: mockProjectFromId,
    };

    // hover over cells
    act(() => {
      component.find('div.vitessce-container').simulate('mouseMove');
      component.find('div.vitessce-container').simulate('wheel');
      vitesscePropsSpy.updateViewInfo(cellCoordinates);
    });

    component.update();

    const crossHairs = component.find(CrossHair);
    const cellInfo = component.find(CellInfo);

    expect(mockProjectFromId).toHaveBeenCalledTimes(1);
    expect(mockProjectFromId).toHaveBeenCalledWith(store.getState().cellInfo.cellId);
    expect(crossHairs.length).toEqual(0);
    expect(cellInfo.length).toEqual(0);
  });

  it('the gene expression view gets rendered correctly', () => {
    const focusedState = {
      ...initialState,
      cellSets: {
        ...initialState.cellSets,
        selected: [],
      },
      genes: {
        ...initialState.genes,
        expression: {
          full: {
            loading: [],
            matrix: getTwoGenesExpressionMatrix(),
          },
        },
      },
      cellInfo: {
        ...initialState.cellInfo,
        focus: {
          ...initialState.cellInfo.focus,
          store: 'genes',
          key: 'Gzma',
        },
      },
    };

    const geneExprStore = mockStore(focusedState);

    const embedding = mount(
      <Provider store={geneExprStore}>
        <Embedding experimentId='1234' width={width} height={height} />
      </Provider>,
    );

    const focusedGeneInfo = embedding.find('Embedding div label strong');
    expect(focusedGeneInfo.length).toEqual(1);
    expect(focusedGeneInfo.props().children).toEqual('Gzma');
  });
});
