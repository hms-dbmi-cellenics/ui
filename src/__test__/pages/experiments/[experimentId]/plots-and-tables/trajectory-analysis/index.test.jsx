import { render, screen, waitFor } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import TrajectoryAnalysis from 'pages/experiments/[experimentId]/plots-and-tables/trajectory-analysis/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import mockEmbedding from '__test__/data/embedding.json';
import mockStartingNodes from '__test__/data/starting_nodes.json';
import mockPseudoTime from '__test__/data/pseudotime.json';
import WorkResponseError from 'utils/errors/http/WorkResponseError';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  delayedResponse,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import userEvent from '@testing-library/user-event';
import { updatePlotConfig } from 'redux/actions/componentConfig';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = (ETagParams) => `${ETagParams.body.name}`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  GetEmbedding: mockEmbedding,
  GetTrajectoryAnalysisStartingNodes: mockStartingNodes,
  GetTrajectoryAnalysisPseudoTime: mockPseudoTime,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'trajectoryAnalysisMain';
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

const trajectoryAnalysisPageFactory = createTestComponentFactory(
  TrajectoryAnalysis,
  defaultProps,
);

const defaultShownPlotDescription = 'Trajectory analysis plot showing clusters with trajectory';
const selectedRootNodes = ['Y_1', 'Y_2', 'Y_3'];

const renderTrajectoryAnalysisPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {trajectoryAnalysisPageFactory()}
      </Provider>,
    )
  ));

  // Select several nodes by default
  await store.dispatch(updatePlotConfig(plotUuid, {
    selectedNodes: selectedRootNodes,
  }));
};

const runPseudotime = () => {
  userEvent.click(screen.getByText('Trajectory analysis'));
  userEvent.click(screen.getByText(/Calculate/i));

  // Pseudotime under display should no longer be disabled
  userEvent.click(screen.getByText(/Display/i));

  expect(screen.getByText(/Pseudotime/i)).not.toBeDisabled();
};

describe('Trajectory analysis plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    let toggleReturnNull = true;

    seekFromS3
      .mockReset()
      .mockImplementation((mockETag) => {
        const result = toggleReturnNull ? null : mockWorkerResponses[mockETag];
        toggleReturnNull = !toggleReturnNull;
        return result;
      });

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText('Trajectory analysis')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Main schema')).toBeInTheDocument();
    expect(screen.getByText('Axes and margins')).toBeInTheDocument();
    expect(screen.getByText('Colours')).toBeInTheDocument();
    expect(screen.getByText('Markers')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
  });

  it('Renders the plot with cluster and trajectory by default', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await waitFor(async () => {
      expect(screen.getByRole('graphics-document', { name: 'Trajectory analysis plot showing clusters with trajectory' })).toBeInTheDocument();
    });
  });

  it('Does not display colours options if displaying clusters', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    userEvent.click(screen.getByText('Colours'));

    expect(screen.getByText(/Background Color/i)).toBeInTheDocument();
    expect(screen.queryByText(/Colour Schemes/i)).toBeNull();
  });

  it('Shows the number of nodes that are selected', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    userEvent.click(screen.getByText('Trajectory analysis'));

    expect(screen.getByText(`${selectedRootNodes.length} nodes selected`)).toBeInTheDocument();
    expect(screen.getByText(/Calculate/i).closest('button')).not.toBeDisabled();

    // The "Clear selection" button is the 2nd element in the body with "Clear selection" text
    // The 1st "Clear selection" text is inside the information text
    const clearSelectionButton = screen.queryAllByText(/Clear selection/i)[1].closest('button');
    expect(clearSelectionButton).toBeInTheDocument();
  });

  it('Trajectory buttons should not be shown if there are no selected nodes', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    userEvent.click(screen.getByText('Trajectory analysis'));

    // The "Clear selection" button is the 2nd element in the body with "Clear selection" text
    // The 1st "Clear selection" text is inside the information text
    const clearSelectionButton = screen.queryAllByText(/Clear selection/i)[1].closest('button');

    // Clearing nodes should hide the text and the buttons
    userEvent.click(clearSelectionButton);

    // Thes is only 1 "Clear selection" text now, which is in the information text
    expect(screen.queryAllByText(/Clear selection/i).length).toEqual(1);

    expect(screen.queryByText(`${selectedRootNodes.length} nodes selected`)).toBeNull();
    expect(screen.queryByText(/Calculate/i)).toBeNull();
  });

  it('Clicking "Calculate" shows for pseudotime', async () => {
    await renderTrajectoryAnalysisPage(storeState);
    runPseudotime();

    await waitFor(async () => {
      expect(screen.getByRole('graphics-document', { name: 'Trajectory analysis plot showing pseudotime with trajectory' })).toBeInTheDocument();
    });
  });

  it('Does not display labels options if displaying pseudotime', async () => {
    await renderTrajectoryAnalysisPage(storeState);
    runPseudotime();

    await waitFor(() => {
      expect(screen.queryByText('Labels')).toBeNull();
    });
  });

  it('Hides trajectory if hidden option is selected', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    userEvent.click(screen.getByText(/Display/i));
    userEvent.click(screen.getByText(/Hide/i));

    await waitFor(async () => {
      expect(screen.getByRole('graphics-document', { name: 'Trajectory analysis plot showing clusters' })).toBeInTheDocument();
    });
  });

  it('Shows a loader if there is no config', async () => {
    const delayedConfigResponse = {
      ...defaultResponses,
      [`experiments/${experimentId}/processingConfig`]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    fetchMock.mockIf(/.*/, mockAPI(delayedConfigResponse));

    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    await waitFor(async () => {
      await expect(screen.queryByRole('graphics-document', { name: defaultShownPlotDescription })).toBeNull();
    });
  });

  it('Shows a loader if cell sets is loading', async () => {
    const cellSetErrorResponse = {
      ...defaultResponses,
      [`experiments/${experimentId}/cellSets`]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetErrorResponse));

    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    await waitFor(async () => {
      await expect(screen.queryByRole('graphics-document', { name: defaultShownPlotDescription })).toBeNull();
    });
  });

  it('Shows an error if fetching cell sets throw an error', async () => {
    const cellSetErrorResponse = {
      ...defaultResponses,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(500, 'some random error'),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetErrorResponse));

    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText(/We're sorry, we couldn't load this/i)).toBeInTheDocument();
    await waitFor(async () => {
      await expect(screen.queryByRole('graphics-document', { name: defaultShownPlotDescription })).toBeNull();
    });
  });

  it('Shows a loader if embedding data is loading', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => delayedResponse({ body: 'Not found', status: 404 }, 4000));

    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    await waitFor(async () => {
      await expect(screen.queryByRole('graphics-document', { name: defaultShownPlotDescription })).toBeNull();
    });
  });

  it('Shows an error if there is an error fetching embedding', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => Promise.reject(new WorkResponseError('some random error')));

    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText(/We had an error on our side while we were completing your request/i)).toBeInTheDocument();
    await waitFor(async () => {
      await expect(screen.queryByRole('graphics-document', { name: defaultShownPlotDescription })).toBeNull();
    });
  });
});
