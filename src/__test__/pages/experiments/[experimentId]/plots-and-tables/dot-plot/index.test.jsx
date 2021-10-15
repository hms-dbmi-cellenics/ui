import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import initialCellSetsState from 'redux/reducers/cellSets/initialState';
import initialGenesState from 'redux/reducers/genes/initialState';

jest.mock('localforage');

jest.mock('swr', () => () => ({
  data: {
    experimentId: '1234ABC',
    experimentName: 'test',
  },
}));

const mockStore = configureMockStore([thunk]);

const dotPlotPageFactory = (state, experimentId) => (
  <Provider store={mockStore(state)}>
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
  cellSets: {
    ...initialCellSetsState,
  },
  genes: {
    ...initialGenesState,
  },
};

describe('Dot plot page', () => {
  it('Renders the plot correctly', () => {
    render(dotPlotPageFactory(initialState, experimentId));

    // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText('Dot plot')).toBeInTheDocument();

    // It has 4 options
    expect(screen.getByText('Gene selection')).toBeInTheDocument();
    expect(screen.getByText('Select data')).toBeInTheDocument();
    expect(screen.getByText('Main schema')).toBeInTheDocument();
    expect(screen.getByText('Axes and margins')).toBeInTheDocument();
    expect(screen.getByText('Colours')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('Shows a skeleton screen if config is not loaded', () => {
    const noConfigState = {
      ...initialState,
      componentConfig: {},
    };

    const { container } = render(dotPlotPageFactory(noConfigState, experimentId));
    const loadingElement = container.querySelectorAll('div[class*="skeleton"]');

    // There is Dot plot for the bread crumbs
    expect(loadingElement.length).toBeGreaterThan(0);

    // It doesn't show the plot
    expect(screen.queryByText('Gene selection')).toBeNull();
    expect(screen.queryByText('Select data')).toBeNull();
    expect(screen.queryByText('Main schema')).toBeNull();
    expect(screen.queryByText('Axes and margins')).toBeNull();
    expect(screen.queryByText('Colours')).toBeNull();
    expect(screen.queryByText('Legend')).toBeNull();
    expect(screen.queryByRole('graphics-document')).toBeNull();
  });
});
