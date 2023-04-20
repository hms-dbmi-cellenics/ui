import { render, screen, waitFor } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import TrajectoryAnalysis from 'pages/experiments/[experimentId]/plots-and-tables/trajectory-analysis/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Vega } from 'react-vega';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import mockEmbedding from '__test__/data/embedding.json';
import mockStartingNodes from '__test__/data/starting_nodes.json';
import mockPseudoTime from '__test__/data/pseudotime.json';
import cellSetsData from '__test__/data/cell_sets.json';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';
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
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag');

  const mockWorkRequestETag = (ETagParams) => `${ETagParams.body.name}`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

jest.mock('react-vega', () => {
  const originalModule = jest.requireActual('react-vega');
  return {
    ...originalModule,
    Vega: jest.fn((...params) => new originalModule.Vega(...params)),
  };
});

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

const defaultShownPlotDescription = 'Trajectory analysis plot showing clusters';
const selectedRootNodes = [0, 1, 2];

const renderTrajectoryAnalysisPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {trajectoryAnalysisPageFactory()}
      </Provider>,
    )
  ));
};

const simulateNodeSelection = async (store) => {
  // Select several nodes
  await store.dispatch(updatePlotConfig(plotUuid, {
    selectedNodes: selectedRootNodes,
  }));

  // Wait until nodes have been selected
  await waitFor(() => {
    expect(screen.getByText('Calculate pseudotime').closest('button')).not.toBeDisabled();
  });
};

const runGetRootNodes = async () => {
  userEvent.click(screen.getByText('Calculate root nodes'));

  // Wait until data is loaded
  await waitFor(() => {
    expect(screen.getByRole(
      'graphics-document', { name: 'Trajectory analysis plot showing clusters with trajectory' },
    )).toBeInTheDocument();
  });
};

const runPseudotime = async () => {
  await simulateNodeSelection(storeState);

  userEvent.click(screen.getByText('Calculate pseudotime'));

  // Pseudotime under display should no longer be disabled
  userEvent.click(screen.getByText('Display'));

  expect(screen.getByText('Pseudotime')).not.toBeDisabled();
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

  it('Renders the plot with louvain cluster by default', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await waitFor(async () => {
      expect(screen.getByRole('graphics-document', { name: 'Trajectory analysis plot showing clusters' })).toBeInTheDocument();
    });
  });

  it('Has select data opened by default', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await waitFor(async () => {
      expect(screen.getByText('Select cell sets to use for trajectory analysis')).toBeInTheDocument();

      expect(screen.getByText('All fake louvain clusters')).toBeInTheDocument();
      expect(screen.getByText('Calculate root nodes')).toBeInTheDocument();
    });
  });

  it('Does not display colours options if displaying clusters', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    userEvent.click(screen.getByText('Colours'));

    expect(screen.getByText('Background Color')).toBeInTheDocument();
    expect(screen.queryByText('Colour Schemes')).toBeNull();
  });

  it('Displays an empty information if no cell sets are selected', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    // Remove selected cell set
    userEvent.click(screen.getByLabelText('close'));

    expect(screen.queryByText(/Select cell sets under 'Select Data' to get started./));

    // Information about root node selection is hidden
    expect(screen.queryByText(/Select root nodes by/)).toBeNull();
    expect(screen.queryByText('Clear selection')).toBeNull();
    expect(screen.queryByText('Calculate pseudotime')).toBeNull();
  });

  it('Running calculate root nodes display root nodes', async () => {
    await renderTrajectoryAnalysisPage(storeState);
    await runGetRootNodes();

    await waitFor(() => {
      expect(screen.getByText(/Select root nodes by/)).toBeInTheDocument();
    });

    await simulateNodeSelection(storeState);

    await waitFor(() => {
      // shows the number of nodes that are selected
      expect(screen.getByText(`${selectedRootNodes.length} nodes selected`)).toBeInTheDocument();
      expect(screen.getByText('Calculate pseudotime').closest('button')).not.toBeDisabled();
    });
  });

  it('Trajectory buttons should be disabled if there are no selected nodes', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await runGetRootNodes();
    await simulateNodeSelection(storeState);

    // The "Clear selection" button is the 2nd element in the body with "Clear selection" text
    // The 1st "Clear selection" text is inside the information text
    const clearSelectionButton = screen.queryAllByText('Clear selection')[1].closest('button');
    expect(clearSelectionButton).toBeInTheDocument();
    expect(clearSelectionButton).not.toBeDisabled();

    const calculatePseudoteTimeButton = screen.getByText('Calculate pseudotime').closest('button');
    expect(calculatePseudoteTimeButton).toBeInTheDocument();
    expect(calculatePseudoteTimeButton).not.toBeDisabled();

    // Clearing nodes should disable the clear selection button
    userEvent.click(clearSelectionButton);
    expect(clearSelectionButton).toBeDisabled();
    expect(calculatePseudoteTimeButton).toBeDisabled();
  });

  it('Clicking "Calculate pseudotime" shows pseudotime', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await runGetRootNodes();
    await runPseudotime();

    await waitFor(async () => {
      expect(screen.getByRole('graphics-document', { name: 'Trajectory analysis plot showing pseudotime with trajectory' })).toBeInTheDocument();
    });
  });

  it('Does not display labels options if displaying pseudotime', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await runGetRootNodes();
    await runPseudotime();

    await waitFor(() => {
      expect(screen.queryByText('Labels')).toBeNull();
    });
  });

  it('Hides trajectory if hidden option is selected', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    userEvent.click(screen.getByText('Display'));
    userEvent.click(screen.getByText('Hide'));

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

  it('lassoSelection handling works well', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await runGetRootNodes();

    const { signalListeners } = _.last(Vega.mock.calls)[0];

    signalListeners.lassoSelection('eventName', [0, 2, -10, 4]);

    await waitFor(() => {
      expect(screen.getByText('9 nodes selected')).toBeInTheDocument();
    });
  });

  it('addNode handling works well', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await runGetRootNodes();
    await simulateNodeSelection(storeState);

    const { signalListeners } = _.last(Vega.mock.calls)[0];

    signalListeners.addNode('eventName', { nodeId: 5 });

    await waitFor(() => {
      expect(screen.getByText('4 nodes selected')).toBeInTheDocument();
    });
  });

  it('removeNode handling works well', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await runGetRootNodes();

    await simulateNodeSelection(storeState);

    const { signalListeners } = _.last(Vega.mock.calls)[0];

    signalListeners.removeNode('eventName', { nodeId: 1 });

    await waitFor(() => {
      expect(screen.getByText('2 nodes selected')).toBeInTheDocument();
    });
  });

  it('Renders a plot legend alert if there are more than MAX_LEGEND_ITEMS number of cell sets', async () => {
    const cellSetsTemplate = (clusterIdx) => ({
      key: `louvain-${clusterIdx}`,
      name: `Cluster ${clusterIdx}`,
      rootNode: false,
      type: 'cellSets',
      color: '#000000',
      cellIds: [clusterIdx],
    });

    const manyCellSets = [...Array(MAX_LEGEND_ITEMS + 1)].map((c, idx) => cellSetsTemplate(idx));

    // Add to louvain cluster
    cellSetsData.cellSets[0].children = manyCellSets;

    const manyCellSetsResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => promiseResponse(JSON.stringify(cellSetsData)),
    };

    fetchMock.mockIf(/.*/, mockAPI(manyCellSetsResponse));

    await renderTrajectoryAnalysisPage(storeState);

    // The legend alert plot text should appear
    waitFor(() => {
      expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/i)).toBeInTheDocument();
    });
  });
});
