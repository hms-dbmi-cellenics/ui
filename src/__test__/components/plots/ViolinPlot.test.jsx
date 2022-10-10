import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import '__test__/test-utils/setupTests';

import ViolinPlot from 'components/plots/ViolinPlot';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadPlotConfig } from 'redux/actions/componentConfig';

import endUserMessages from 'utils/endUserMessages';

import _ from 'lodash';
import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
} from '__test__/test-utils/mockAPI';

import fake from '__test__/test-utils/constants';
import { plotTypes } from 'utils/constants';

enableFetchMocks();

const plotType = plotTypes.VIOLIN_PLOT;
const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'ViolinMain'; // At some point this will stop being hardcoded

const customAPIResponses = {
  [`/plots/${plotUuid}`]: () => statusResponse(404, 'Not found'),
};

const mockAPIResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = {
  experimentId,
  plotUuid,
}

const violinPlotFactory = createTestComponentFactory(ViolinPlot, defaultProps);

const renderViolinPlot = async (storeState) => {
  await act(async () => {
    render(
      <Provider store={storeState}>
        {violinPlotFactory()}
      </Provider>,
    );
  });
};

let storeState = null;

describe.skip('ViolinPlot', () => {
  beforeEach(async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    storeState = makeStore();
    await storeState.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  });

  it('Shows a loader screen if cell sets are not loaded / still loading', async () => {
    await renderViolinPlot(storeState);

    expect(screen.getByText("We're getting your data ...")).toBeInTheDocument();
  });

  it('Renders a plot', async () => {
    await renderViolinPlot(storeState);

    await act(async () => {
      storeState.dispatch(loadCellSets(experimentId));
    });

    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });

  it('Shows an error if there is an error while loading cellSets', async () => {
    const errorResponse = {
      ...mockAPIResponses,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(500, 'Some random error'),
    };

    fetchMock.mockIf(/.*/, mockAPI(errorResponse));

    renderViolinPlot(storeState);

    // Load cell sets for the plot and get error
    await act(async () => {
      storeState.dispatch(loadCellSets(experimentId));
    });

    // No plot should be rendered
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    // Error message should be shown
    expect(screen.getByText(endUserMessages.ERROR_FETCHING_CELL_SETS)).toBeInTheDocument();

    const reloadButton = screen.getByText('Try again');
    userEvent.click(reloadButton);
  });
});
