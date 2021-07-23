import React from 'react';
import {
  Provider,
} from 'react-redux';
import { act } from 'react-dom/test-utils';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
// eslint-disable-next-line import/extensions
import { Scatterplot } from 'vitessce/dist/es/production/scatterplot.min.js';
import Embedding from '../../../../components/data-exploration/embedding/Embedding';
import CrossHair from '../../../../components/data-exploration/embedding/CrossHair';
import CellInfo from '../../../../components/data-exploration/CellInfo';
import { CELL_SETS_CREATE } from '../../../../redux/actionTypes/cellSets';
import { initialEmbeddingState } from '../../../../redux/reducers/embeddings/initialState';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';
import { CELL_INFO_UPDATE } from '../../../../redux/actionTypes/cellInfo';

jest.mock('localforage');

const mockStore = configureMockStore([thunk]);
let component;
let store;

const width = 100;
const height = 200;

const initialExperimentState = generateExperimentSettingsMock([]);

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
        loading: false,
        data: {},
      },
    },
    cellInfo: {
      cellName: 2,
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

    component = mount(
      <Provider store={store}>
        <Embedding experimentId='1234' width={width} height={height} />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  configure({ adapter: new Adapter() });

  it('renders correctly a PCA embedding', () => {
    const scatterplot = component.find(Scatterplot);

    expect(component.find('Embedding').length).toEqual(1);
    expect(scatterplot.length).toEqual(1);
    expect(scatterplot.getElement().props.mapping).toEqual('PCA');
    expect(scatterplot.getElement().props.cellColors).toEqual(
      new Map(
        Object.entries({
          // cell #2 is currently being hovered over, so it is black
          2: [0, 0, 0],

          // cell #3 is in louvain, which is currently in focus. it should be red.
          3: [255, 0, 0],
        }),
      ),
    );

    expect(scatterplot.getElement().props.cells).toEqual(
      {
        0: {
          mappings: {
            PCA: [-13, 32],
          },
        },
        1: {
          mappings: {
            PCA: [6, 7],
          },
        },
        2: {
          mappings: {
            PCA: [43, 9],
          },
        },
        3: {
          mappings: {
            PCA: [57, 3],
          },
        },
      },
    );
  });

  it('renders correctly a popover on lasso selection and closes it on cancel', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('ClusterPopover').length).toEqual(0);

    const selectedCellIds = new Set([1, 2]);
    // lasso select cells 1 and 2
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
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
    const scatterplot = component.find(Scatterplot);
    const selectedCellIds = new Set();

    // lasso select cells 1 and 2
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(0);
  });

  it('does not render cell info and crosshair when the popover is open', () => {
    const scatterplot = component.find(Scatterplot);
    // lasso select cells 1 and 2
    const selectedCellIds = new Set([1, 2]);
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(1);
    expect(component.find(CrossHair).length).toEqual(0);
    expect(component.find(CellInfo).length).toEqual(0);
  });

  it('renders correctly a popover on lasso selection and creates a new cluster on create', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('ClusterPopover').length).toEqual(0);

    // lasso select cells 1 and 2
    const selectedCellIds = new Set([1, 2]);
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
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
    const scatterplot = component.find(Scatterplot);

    const hoveredCell = { cellId: 1 };

    // hover over cells
    act(() => {
      scatterplot.getElement().props.updateCellsHover(hoveredCell);
    });

    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(CELL_INFO_UPDATE);
    expect(store.getActions()[0].payload.cellName).toEqual(hoveredCell.cellId);
  });

  it('renders CrossHair and CellInfo components when user hovers over cell', () => {
    store = mockStore(initialState);

    const mockProject = jest.fn((cellId) => store.getState().embeddings.umap.data[cellId]);

    const cellCoordinates = {
      project: mockProject,
    };

    component = mount(
      <Provider store={store}>
        <Embedding experimentId='1234' width={width} height={height} />
      </Provider>,
    );
    const scatterplot = component.find(Scatterplot);

    // hover over cells
    act(() => {
      component.find('div.vitessce-container').simulate('mouseMove');
      scatterplot.getElement().props.updateViewInfo(cellCoordinates);
    });

    component.update();

    const crossHairs = component.find(CrossHair);
    const cellInfo = component.find(CellInfo);

    expect(mockProject).toHaveBeenCalledTimes(1);
    expect(mockProject).toHaveBeenCalledWith(store.getState().cellInfo.cellName);
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

    const mockProject = jest.fn((cellId) => store.getState().embeddings.umap.data[cellId]);

    const cellCoordinates = {
      project: mockProject,
    };

    component = mount(
      <Provider store={store}>
        <Embedding experimentId='1234' width={width} height={height} />
      </Provider>,
    );
    const scatterplot = component.find(Scatterplot);

    // hover over cells
    act(() => {
      component.find('div.vitessce-container').simulate('mouseMove');
      component.find('div.vitessce-container').simulate('wheel');
      scatterplot.getElement().props.updateViewInfo(cellCoordinates);
    });

    component.update();

    const crossHairs = component.find(CrossHair);
    const cellInfo = component.find(CellInfo);

    expect(mockProject).toHaveBeenCalledTimes(1);
    expect(mockProject).toHaveBeenCalledWith(store.getState().cellInfo.cellName);
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
          loading: [],
          data: {
            REALGENE: {
              rawExpression: {
                min: 0,
                max: 1.6,
                expression: [0, 0.4, 0.5, 1.6],
              },
              truncatedExpression: {
                min: 0,
                max: 1.6,
                expression: [0, 0.4, 0.5, 1.6],
              },
            },
          },
        },
      },
      cellInfo: {
        ...initialState.cellInfo,
        focus: {
          ...initialState.cellInfo.focus,
          store: 'genes',
          key: 'REALGENE',
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
    expect(focusedGeneInfo.props().children).toEqual('REALGENE');
  });
});
