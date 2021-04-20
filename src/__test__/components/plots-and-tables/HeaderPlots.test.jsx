import React from 'react';
import thunk from 'redux-thunk';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { Button } from 'antd';
import { initial } from 'lodash';
import { act } from 'react-dom/test-utils';
import { initialPlotConfigStates } from '../../../redux/reducers/componentConfig/initialState';

import Header from '../../../components/plots/Header';
import waitForComponentToPaint from '../../../utils/tests/waitForComponentToPaint';

jest.mock('localforage');
configure({ adapter: new Adapter() });
const mockStore = configureMockStore([thunk]);

describe('Tests for the header in plots and tables ', () => {
  const initialConfig = initialPlotConfigStates.embeddingContinuous;
  const route = {
    path: 'embedding-continuous',
    breadcrumbName: 'Continuous Embedding',
  };
  let component;
  beforeAll(async () => {
    await preloadAll();

    component = mount(
      <Provider store={store}>
        <Header
          experimentId='a'
          testing
          plotUuid='embeddingContinuousMain'
          finalRoute={route}
        />
      </Provider>,
    );
  });
  const store = mockStore({
    componentConfig: {
      embeddingContinuousMain: {
        config: {
          ...initialConfig,
          axes: {
            ...initialConfig.axes,
            yAxisText: 'Changed value lol',
          },
        },
        plotType: 'embeddingContinuous',
      },
    },
  });
  it('Reset button resets to default config', () => {
    const button = component.find('#resetButton').at(0);
    expect(button.length).toEqual(1);
    act(() => { button.simulate('click'); });
    expect(store.getActions()[0].type).toEqual('componentConfig/load');
    expect(store.getActions()[0].payload.config).toEqual(initialConfig);
  });
});
