import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { Switch } from 'antd';
import HeatmapMetadataTrackSettings from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/HeatmapMetadataTrackSettings';

import { UPDATE_CONFIG } from '../../../../../../../redux/actionTypes/componentConfig';

jest.mock('localforage');
jest.mock('../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/VegaHeatmap');

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });

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
          {
            key: 'louvain-2',
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
        cellIds: [5, 6, 7],
      },
      'louvain-1': {
        name: 'louvain 1',
        cellIds: [1, 2, 3],
      },
      'louvain-2': {
        name: 'louvain 2',
        cellIds: [9, 11, 13],
      },
      sample: {
        type: 'metadataCategorical',
        name: 'Sample',
      },
      control: {
        name: 'control',
        cellIds: [5, 6, 7],
      },
      treated: {
        name: 'treated',
        cellIds: [1, 2, 3],
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
        <HeatmapMetadataTrackSettings experimentId='123' />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapMetadataTrackSettings').length).toEqual(1);

    // With four buttons.
    const buttons = component.find('Button');
    expect(buttons.length).toEqual(4);

    // With two switches.
    const switches = component.find(Switch);
    expect(switches.length).toEqual(2);

    // The first rendered button should be disabled.
    expect(buttons.at(0).props().disabled).toEqual(true);

    // The last rendered button should be disabled.
    expect(buttons.at(buttons.length - 1).props().disabled).toEqual(true);
  });

  it('order and shown tracks are changed when the switches and the buttons are pressed', () => {
    const store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        <HeatmapMetadataTrackSettings experimentId='123' />
      </Provider>,
    );

    expect(store.getActions().length).toEqual(1);

    // Get switches and click on second one.
    const switches = component.find(Switch);
    switches.at(1).simulate('click');

    // The store should update.
    expect(store.getActions().length).toEqual(2);
    const action = store.getActions()[1];
    expect(action.type).toBe(UPDATE_CONFIG);
    expect(action).toMatchSnapshot();

    // Get buttons.
    const buttons = component.find('Button');

    // Press the down button in the first row.
    buttons.at(1).simulate('click');

    // The store should update.
    expect(store.getActions().length).toEqual(3);
    const reorderAction = store.getActions()[2];
    expect(reorderAction.type).toBe(UPDATE_CONFIG);
    expect(reorderAction).toMatchSnapshot();
  });
});
