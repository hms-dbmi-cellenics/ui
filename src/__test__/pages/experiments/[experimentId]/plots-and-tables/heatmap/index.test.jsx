import { render, screen } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import Heatmap from 'pages/experiments/[experimentId]/plots-and-tables/heatmap/index';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import { makeStore } from 'redux/store';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

jest.mock('redux/actions/componentConfig', () => {
  const originalModule = jest.requireActual('redux/actions/componentConfig');
  const { UPDATE_CONFIG } = jest.requireActual('redux/actionTypes/componentConfig');

  return {
    ...originalModule,
    updatePlotConfig: jest.fn((plotUuid, configChanges) => (dispatch) => {
      dispatch({
        type: UPDATE_CONFIG,
        payload:
          { plotUuid, configChanges },
      });
    }),
  };
});

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'heatmapPlotMain';
let storeState = null;

const customAPIResponses = {
  [`/plots/${plotUuid}`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };

const heatmapPageFactory = createTestComponentFactory(Heatmap, defaultProps);

const renderHeatmapPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {heatmapPageFactory()}
      </Provider>,
    )
  ));
};

describe('Heatmap plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Metadata tracks/i)).toBeInTheDocument();
    expect(screen.getByText(/Group by/i)).toBeInTheDocument();
    expect(screen.getByText(/Expression values/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Shows an Empty icon and text to get started', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByText(/Add some genes to this heatmap to get started/i)).toBeInTheDocument();
  });

  it('Changing clusters updates the plot data', async () => {
    await renderHeatmapPage(storeState);

    // Open the Select Data panel
    userEvent.click(screen.getByText(/Select data/i));

    // Change from Louvain to Custom cell sets
    userEvent.click(screen.getByText(/Louvain/i));
    userEvent.click(screen.getByText(/Custom cell sets/i), null, { skipPointerEventsCheck: true });

    expect(updatePlotConfig).toHaveBeenCalled();
  });
});
