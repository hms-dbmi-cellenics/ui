/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DotPlot from 'components/plots/DotPlot';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import initialCellSetsState from 'redux/reducers/cellSets/initialState';
import { getCellSets } from 'redux/selectors';

const mockStore = configureMockStore([thunk]);

jest.mock('redux/selectors');

const dotPlotFactory = (store, config) => (
  <Provider store={mockStore(store)}>
    <DotPlot config={config} />
  </Provider>
);

const config = initialPlotConfigStates.dotPlot;

const state = {};

describe('DotPlot', () => {
  it('Renders a plot', async () => {
    getCellSets.mockImplementation(() => () => ({
      ...initialCellSetsState,
      loading: false,
      hierarchy: [
        {
          key: 'louvain',
          children: [
            { key: 'louvain-0' },
          ],
        },
      ],
    }));

    // Expects Vega to be called
    render(dotPlotFactory(state, config));

    await waitFor(() => {
      expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
    });
  });

  it('Shows a loading screen if cell sets is still loading', () => {
    getCellSets.mockImplementation(() => () => ({
      ...initialCellSetsState,
      loading: true,
    }));

    render(dotPlotFactory(state, config));

    expect(screen.getByText("We're getting your data...")).toBeInTheDocument();
  });

  it('Shows an error if there is an error while loading cellSets', () => {
    const errorMessage = 'This is an error message';

    getCellSets.mockImplementation(() => () => ({
      ...initialCellSetsState,
      error: new Error(errorMessage),
      loading: false,
    }));

    render(dotPlotFactory(state, config));

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
