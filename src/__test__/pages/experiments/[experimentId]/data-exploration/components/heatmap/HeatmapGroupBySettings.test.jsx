import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { Radio } from 'antd';
import HeatmapGroupBySettings from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/HeatmapGroupBySettings';

jest.mock('localforage');
jest.mock('../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/VegaHeatmap');

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });

let component;

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
        <HeatmapGroupBySettings experimentId='123' width={200} height={200} />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapGroupBySettings').length).toEqual(1);

    // With two buttons.
    const buttons = component.find('Radio');
    expect(buttons.length).toEqual(2);

    // With the right keys.
    expect(buttons.at(0).props().value).toEqual('louvain');
    expect(buttons.at(1).props().value).toEqual('sample');

    // The selected one should be `sample`.
    expect(component.find(Radio.Group).props().value).toEqual('sample');
  });
});
