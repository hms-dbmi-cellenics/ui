import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { Radio } from 'antd';

import { UPDATE_CONFIG } from '../../../../../../../redux/actionTypes/componentConfig';
import HeatmapLegendVisibilitySettings from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/HeatmapLegendVisibilitySettings';

const initialState = {
  cellSets: {
    // cellSets', 'metadataCategorical
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
        cellIds: [5, 6, 7],
      },
      'louvain-1': {
        name: 'louvain 1',
        cellIds: [1, 2, 3],
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
        groupedTrack: 'sample',
        selectedTracks: ['louvain'],
        legendIsVisible: true,
      },
    },
  },
};

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });

const eventStub = {
  stopPropagation: () => { },
};

describe('HeatmapLegendVisibilitySettings', () => {
  let component, store, buttons;

  afterEach(() => {
    component.unmount();
  });

  beforeEach(() => {
    store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        {/* ask if experimentId='123' width={200} height={200} are necessary in HeatmapGroupBySettings */}
        <HeatmapLegendVisibilitySettings experimentId='123' width={200} height={200} />
      </Provider>,
    );
  });

  it('renders correctly', () => {
    const buttons = component.find('Radio');

    // Should be rendered.
    expect(component.find('HeatmapLegendVisibilitySettings').length).toEqual(1);

    // With two buttons.
    expect(buttons.length).toEqual(2);

    // With the right keys.
    expect(buttons.at(0).props().value).toEqual(true);
    expect(buttons.at(1).props().value).toEqual(false);

    // The selected one should be `Show`.
    expect(component.find(Radio.Group).props().value).toEqual(true);
  });

  it('responds correctly to clicking to hide', () => {
    // Click hide button
    act(() => {
      component.find('ForwardRef').props().onChange({ "target": { "value": false } });
    });

    let storeActions = store.getActions();

    // Only one action was dispatched
    expect(storeActions.length).toEqual(1);

    let action = storeActions[0];
    let configChange = action.payload.configChange;

    // Of the correct type
    expect(action.type).toBe(UPDATE_CONFIG);

    // With the correct property
    expect(configChange).toHaveProperty("legendIsVisible", false);

    // QUESTION: Should I check that the object doesn't have any other property? (example: check size is 1)
  });

  it('responds correctly to clicking to show', () => {
    // Click show button
    act(() => {
      component.find('ForwardRef').props().onChange({ "target": { "value": true } });
    });

    let storeActions = store.getActions();

    // Only one action was dispatched
    expect(storeActions.length).toEqual(1);

    let action = storeActions[0];
    let configChange = action.payload.configChange;

    // Of the correct type
    expect(action.type).toBe(UPDATE_CONFIG);

    // With the correct property
    expect(configChange).toHaveProperty("legendIsVisible", true);
  });
});
