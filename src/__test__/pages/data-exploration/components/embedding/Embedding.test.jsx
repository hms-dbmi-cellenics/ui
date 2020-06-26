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
import Embedding from '../../../../../pages/data-exploration/components/embedding/Embedding';

const mockStore = configureMockStore([thunk]);
let component;
let store;

describe('Embedding', () => {
  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    // Clears the database and adds some testing data.
    // Jest will wait for this promise to resolve before running tests.
    store = mockStore({
      cells: {
        data: {
          1: [-13, 32],
          2: [6, 7],
          3: [43, 9],
          4: [57, 3],
        },
      },
      cellSetsColor: {
        data: [
          {
            color: '#ff0000',
            cellIds: ['1', '2', '3', '4'],
          },
        ],
      },
      cellInfo: {},
      focusedGene: {},
    });

    component = mount(
      <Provider store={store}>
        <Embedding experimentID='1234' embeddingType='pca' />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  configure({ adapter: new Adapter() });
  test('renders correctly a PCA embedding', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('Embedding').length).toEqual(1);
    expect(scatterplot.length).toEqual(1);
    expect(scatterplot.getElement().props.mapping).toEqual('PCA');
    expect(scatterplot.getElement().props.cellColors).toEqual(
      {
        1: [255, 0, 0],
        2: [255, 0, 0],
        3: [255, 0, 0],
        4: [255, 0, 0],
      },
    );
    expect(scatterplot.getElement().props.cells).toEqual(
      {
        1: {
          mappings: {
            PCA: [-13, 32],
          },
        },
        2: {
          mappings: {
            PCA: [6, 7],
          },
        },
        3: {
          mappings: {
            PCA: [43, 9],
          },
        },
        4: {
          mappings: {
            PCA: [57, 3],
          },
        },
      },
    );
  });

  test('renders correctly a popover on lasso selection and closes it on cancel', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('ClusterPopover').length).toEqual(0);

    // lasso select cells 1 and 2
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(['1', '2']);
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

  test('renders correctly a popover on lasso selection and creates a new cluster on create', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('ClusterPopover').length).toEqual(0);

    // lasso select cells 1 and 2
    const selectedCellIds = ['1', '2'];
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();
    let popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(1);

    // click create in the popover
    act(() => {
      popover.getElement().props.onCreate();
    });
    component.update();
    popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(0);
    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual('CELL_SETS.CREATE');
    expect(store.getActions()[0].data.cellIds).toEqual(selectedCellIds);
  });

  test('dispatches an action with updated cell information on hover', () => {
    const scatterplot = component.find(Scatterplot);

    const hoveredCell = { cellId: 'ATCG-1' };

    // hover over cells
    act(() => {
      scatterplot.getElement().props.updateCellsHover(hoveredCell);
    });

    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual('UPDATE_CELL_INFO');
    expect(store.getActions()[0].data.cellName).toEqual(hoveredCell.cellId);
  });

  test('the gene expression view gets rendered correctly', () => {
    const geneExprStore = mockStore({
      cells: {
        data: {
          1: [-13, 32],
          2: [6, 7],
          3: [43, 9],
          4: [57, 3],
        },
      },
      cellSetsColor: {
        data: [
          {
            color: '#ff0000',
            cellIds: ['1', '2', '3', '4'],
          },
        ],
      },
      cellInfo: {},
      focusedGene: {
        cells: ['1', '2', '3', '4'],
        expression: [0, 0.4, 0.5, 1.6],
        geneName: 'A',
        maxExpression: 1.6,
        minExpression: 0,
        isLoading: false,
      },
    });

    const embedding = mount(
      <Provider store={geneExprStore}>
        <Embedding experimentID='1234' embeddingType='pca' />
      </Provider>,
    );

    const geneExprInfo = embedding.find('Embedding div.vitessce-container').children().at(0);
    expect(geneExprInfo.length).toEqual(1);
    expect(geneExprInfo.props().children[1].type).toEqual('b');
    expect(geneExprInfo.props().children[1].props.children).toEqual('A');

    const legend = embedding.find('Embedding div.vitessce-container').children().at(2);
    expect(legend.length).toEqual(1);
    expect(legend.props().children.type).toEqual('img');
  });
});
