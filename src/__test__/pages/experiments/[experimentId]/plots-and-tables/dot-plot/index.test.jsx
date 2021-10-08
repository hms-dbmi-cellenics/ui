import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { Skeleton } from 'antd';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

configure({ adapter: new Adapter() });

jest.mock('swr', () => () => ({
  data: {
    experimentId: '1234ABC',
    experimentName: 'test',
  },
}));

const mockStore = configureMockStore([thunk]);

const dotPlotPageFactory = (experimentId, store) => (
  <Provider store={store}>
    <DotPlotPage experimentId={experimentId} />
  </Provider>
);

const experimentId = '1234ABC';
const plotUuid = 'dotPlotMain';

const initialState = {
  componentConfig: {
    [plotUuid]: {
      config: initialPlotConfigStates.dotPlot,
    },
  },
};

describe('Dot plot page', () => {
  it('Renders the plot correctly', () => {
    const store = mockStore(initialState);
    render(dotPlotPageFactory(experimentId, store));

    // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText('Dot plot')).toBeInTheDocument();

    // It has 4 options
    expect(screen.getByText('Gene selection')).toBeInTheDocument();
    expect(screen.getByText('Main schema')).toBeInTheDocument();
    expect(screen.getByText('Axes and Margins')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('Shows a skeleton screen if config is not loaded', () => {
    const noConfigState = {
      componentConfig: {},
    };

    const store = mockStore(noConfigState);
    const component = mount(dotPlotPageFactory(experimentId, store));

    // There is Dot plot for the bread crumbs
    expect(component.find(Skeleton)).toHaveLength(1);
  });
});
