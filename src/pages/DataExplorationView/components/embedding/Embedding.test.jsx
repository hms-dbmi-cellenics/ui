/* eslint-env jest */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Scatterplot } from 'vitessce/build-lib/es/production/scatterplot.min.js';
import Embedding from './Embedding';


const mockStore = configureMockStore([thunk]);
let component;
let store;

describe('Embedding', () => {
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
    });

    component = mount(
      <Provider store={store}>
        <Embedding experimentID="1234" embeddingType="pca" />
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
});
