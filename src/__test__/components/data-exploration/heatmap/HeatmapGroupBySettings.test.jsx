import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import waitForActions from 'redux-mock-store-await-actions';
import thunk from 'redux-thunk';
import { act } from 'react-dom/test-utils';

import configureMockStore from 'redux-mock-store';
import {
  Button, Dropdown,
} from 'antd';
import { UPDATE_CONFIG } from 'redux/actionTypes/componentConfig';
import HeatmapGroupBySettings from 'components/data-exploration/heatmap/HeatmapGroupBySettings';

const mockStore = configureMockStore([thunk]);

let component;

const initialState = {
  cellSets: {
    hierarchy: [
      {
        key: 'louvain',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
        ],
      },
      {
        key: 'sample',
        children: [
          {
            key: 'control',
          },
          {
            key: 'treated',
          },
        ],
      },
    ],
    properties: {
      louvain: {
        type: 'cellSets',
        name: 'louvain clusters',
      },
      'louvain-0': {
        name: 'louvain 0',
        cellIds: new Set([5, 6, 7]),
      },
      'louvain-1': {
        name: 'louvain 1',
        cellIds: new Set([1, 2, 3]),
      },
      sample: {
        type: 'metadataCategorical',
        name: 'Sample',
      },
      control: {
        name: 'control',
        cellIds: new Set([5, 6, 7]),
      },
      treated: {
        name: 'treated',
        cellIds: new Set([1, 2, 3]),
      },
    },
  },
  cellInfo: {},
  componentConfig: {
    interactiveHeatmap: {
      config: {
        groupedTracks: ['sample'],
        selectedTracks: ['louvain'],
      },
    },
  },
};

describe('HeatmapGroupBySettings', () => {
  afterEach(() => {
    component.unmount();
  });

  it('renders correctly', () => {
    const store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        <HeatmapGroupBySettings componentType='interactiveHeatmap' experimentId='123' />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapGroupBySettings').length).toEqual(1);

    const reorderableList = component.find('ReorderableList');
    const groupByItems = reorderableList.find('Item');

    // with one item
    expect(groupByItems.length).toEqual(1);

    // the item should be samples
    expect(groupByItems.at(0).text()).toEqual('Sample');

    // there's a dropdown
    const dropdown = component.find(Dropdown);
    const submenu = shallow(<div>{dropdown.prop('overlay')}</div>);
    const subMenuItems = submenu.find('MenuItem');

    // With two items.
    expect(subMenuItems.length).toEqual(2);

    // each of which should have the right names.
    expect(subMenuItems.at(0).find('div').text()).toEqual('louvain clusters');
    expect(subMenuItems.at(1).find('div').text()).toEqual('Sample');
  });

  test('interacting with the groupby add/remove options will trigger the appropriate actions', async () => {
    const store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        <HeatmapGroupBySettings componentType='interactiveHeatmap' experimentId='123' width={200} height={200} />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapGroupBySettings').length).toEqual(1);

    const dropdown = component.find(Dropdown);
    const submenu = shallow(<div>{dropdown.prop('overlay')}</div>);
    const subMenuItems = submenu.find('MenuItem');

    // When the other group by is clicked...
    const buttons = subMenuItems.find(Button);
    act(() => { buttons.at(0).simulate('click'); });
    component.update();

    await waitForActions(store, [UPDATE_CONFIG]);

    // The store should update.
    expect(store.getActions().length).toEqual(1);
    const firstAction = store.getActions()[0];
    expect(firstAction.type).toBe(UPDATE_CONFIG);
    expect(firstAction).toMatchSnapshot();
    store.clearActions();
    expect(store.getActions().length).toEqual(0);

    component.update();
    const reorderableList = component.find('ReorderableList');
    const groupByItems = reorderableList.find('Item');

    // there should be 2 group by items
    expect(groupByItems.length).toEqual(2);

    // the first item should be samples
    expect(groupByItems.at(0).text()).toEqual('Sample');
    // the second item should be louvain
    expect(groupByItems.at(1).text()).toEqual('louvain clusters');

    // when the groupby is clicked again
    act(() => { buttons.at(0).simulate('click'); });
    component.update();

    await waitForActions(store, [UPDATE_CONFIG]);

    // The store should update.
    expect(store.getActions().length).toEqual(1);
    const secondAction = store.getActions()[0];

    expect(secondAction.type).toBe(UPDATE_CONFIG);
    expect(secondAction).toMatchSnapshot();

    // there should be 2 group by items
    expect(groupByItems.length).toEqual(2);

    // and the first item should be samples
    expect(groupByItems.at(0).text()).toEqual('Sample');
  });

  test('interacting with the groupby reorder options will trigger the appropriate actions', async () => {
    const store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        <HeatmapGroupBySettings componentType='interactiveHeatmap' experimentId='123' width={200} height={200} />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapGroupBySettings').length).toEqual(1);

    const dropdown = component.find(Dropdown);
    const submenu = shallow(<div>{dropdown.prop('overlay')}</div>);
    const subMenuItems = submenu.find('MenuItem');

    // Add a louvain group by
    const addButtons = subMenuItems.find(Button);
    act(() => { addButtons.at(0).simulate('click'); });

    await waitForActions(store, [UPDATE_CONFIG]);
    component.update();

    const reorderableList = component.find('ReorderableList');
    const groupByItems = reorderableList.find('Item');

    // there should be 2 group by items
    expect(groupByItems.length).toEqual(2);

    // clear store from this action (not being tested here)
    await waitForActions(store, [UPDATE_CONFIG]);
    store.clearActions();

    // the first item should be samples
    expect(groupByItems.at(0).text()).toEqual('Sample');
    // the second item should be louvain (the first one is the dropdown)
    expect(groupByItems.at(1).text()).toEqual('louvain clusters');

    // after a click for sample to go down
    const reorderButtonsSample = groupByItems.at(0).find('Button');
    reorderButtonsSample.at(1).simulate('click');

    // the store should update.
    await waitForActions(store, [UPDATE_CONFIG]);
    expect(store.getActions().length).toEqual(1);
    const secondAction = store.getActions()[0];
    expect(secondAction).toMatchSnapshot();
  });
});
