/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import PlotContainer from 'components/plots/PlotContainer';

import { makeStore } from 'redux/store';

import { plotTypes } from 'utils/constants';
import fake from '__test__/test-utils/constants';
import { loadPlotConfig, updatePlotConfig } from 'redux/actions/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { act } from 'react-dom/test-utils';

enableFetchMocks();

jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

const plotType = plotTypes.DOT_PLOT;
const plotUuid = 'DotPlotMain';
const experimentId = fake.EXPERIMENT_ID;

const defaultProps = {
  experimentId,
  plotUuid,
  plotType,
};

const renderPlotContainer = (store, props = {}) => {
  const containerProps = { ...defaultProps, ...props };

  render(
    <Provider store={store}>
      <PlotContainer {...containerProps}>
        <>Mock plot</>
      </PlotContainer>
    </Provider>,
  );
};

let store = null;

fetchMock.mockIf(/.*/, (req) => {
  const path = req.url;
  // Saving config, return 200
  if (path.match(`/v2/experiments/${experimentId}/plots/${plotUuid}`)) {
    return Promise.resolve({ body: JSON.stringify('Plot saved') });
  }
  return Promise.resolve({ status: 404, body: JSON.stringify('Plot config not found') });
});

describe('PlotContainer', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    store = makeStore();
    await store.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  });

  it('Renders itself and its children properly', async () => {
    renderPlotContainer(store);

    expect(screen.getByText('Mock plot')).toBeInTheDocument();
    expect(screen.getByText('Reset Plot')).toBeInTheDocument();
  });

  it('Renders extra toolbar button', async () => {
    const toolbarText = 'Extra toolbar button';
    renderPlotContainer(store, { extraToolbarControls: <div>{toolbarText}</div> });

    expect(screen.getByText(toolbarText)).toBeInTheDocument();
  });

  it('Renders extra control panels', async () => {
    const controlPanelText = 'control panel text';
    renderPlotContainer(store, { extraControlPanels: <div>{controlPanelText}</div> });

    expect(screen.getByText(controlPanelText)).toBeInTheDocument();
  });

  it('Not showing reset removes the reset button', async () => {
    renderPlotContainer(store, { showResetButton: false });

    expect(screen.queryByText('Reset Plot')).toBeNull();
  });

  it('Renders tooltips', async () => {
    renderPlotContainer(store, { plotInfo: 'plot information' });

    // There should be an information button on the document
    const tooltip = screen.getByRole('button', { name: 'info-circle' });
    expect(tooltip).toBeInTheDocument();

    // Hovering over the element should show tooltip
    userEvent.hover(tooltip);

    await waitFor(() => {
      expect(screen.getByText('plot information')).toBeInTheDocument();
    });
  });

  it('Clicking reset button resets the plot config', async () => {
    const defaultWidth = initialPlotConfigStates[plotType].dimensions.width;

    renderPlotContainer(store);

    // Reset button should be disabled because there are no changes to config
    expect(screen.getByText('Reset Plot').closest('button')).toBeDisabled();

    act(() => {
      store.dispatch(updatePlotConfig(plotUuid, { dimensions: { width: 1000 } }));
    });

    // Check that plot config has changed
    const changedWidth = store.getState().componentConfig[plotUuid].config.dimensions.width;
    expect(changedWidth).not.toEqual(defaultWidth);

    // Clicking reset should reset the width
    expect(screen.getByText('Reset Plot').closest('button')).not.toBeDisabled();
    userEvent.click(screen.getByText('Reset Plot'));

    await waitFor(() => {
      const resetWidth = store.getState().componentConfig[plotUuid].config.dimensions.width;
      expect(resetWidth).toEqual(defaultWidth);
    });
  });
});
