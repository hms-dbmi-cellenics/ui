import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { Radio } from 'antd';
import HeatmapExpressionValuesSettings from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/HeatmapExpressionValuesSettings';

import { UPDATE_CONFIG } from '../../../../../../../redux/actionTypes/componentConfig';

jest.mock('localforage');

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });

let component;

const initialState = {
  componentConfig: {
    interactiveHeatmap: {
      config: {
        groupedTrack: 'sample',
        selectedTracks: ['louvain'],
        expressionValue: 'raw',
      },
    },
  },
};

describe('HeatmapExpressionValuesSettings', () => {
  afterEach(() => {
    component.unmount();
  });

  it('renders correctly', () => {
    const store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        <HeatmapExpressionValuesSettings />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapExpressionValuesSettings').length).toEqual(1);

    // With two buttons.
    const buttons = component.find('Radio');
    expect(buttons.length).toEqual(2);

    // With the right keys.
    expect(buttons.at(0).props().value).toEqual('raw');
    expect(buttons.at(1).props().value).toEqual('zScore');

    // The selected one should be `raw`.
    expect(component.find(Radio.Group).props().value).toEqual('raw');
  });

  it('choosing another setting will trigger the appropriate action', async () => {
    const store = mockStore({
      ...initialState,
    });

    component = mount(
      <Provider store={store}>
        <HeatmapExpressionValuesSettings />
      </Provider>,
    );

    // Should be rendered.
    expect(component.find('HeatmapExpressionValuesSettings').length).toEqual(1);

    // When a separate expression value by is selected...
    const { onChange } = component.find(Radio.Group).props();
    onChange({ target: { value: 'zScore' } });

    // The store should update.
    const action = store.getActions()[0];
    expect(action.type).toEqual(UPDATE_CONFIG);
    expect(action).toMatchSnapshot();
  });
});
