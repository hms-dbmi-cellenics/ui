import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import mockAPI, { generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import mockEmbedding from '__test__/data/embedding.json';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import mockStartingNodes from '__test__/data/starting_nodes.json';
import mockProcessingConfig from '__test__/data/processing_config.json';

import { plotTypes } from 'utils/constants';

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = () => 'embedding';

  return mockWorkResultETag(objectHash, mockWorkRequestETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  embedding: () => Promise.resolve(mockEmbedding),
};

const mockOnPlotDataErrorRetry = jest.fn();

const defaultAPIResponse = generateDefaultMockAPIResponses(experimentId);

const mockPlotState = {
  displayTrajectory: true,
  displayPseudotime: false,
  isZoomedOrPanned: false,
};

const mockOnUpdate = jest.fn();
const mockOnClickNode = jest.fn();
const mockOnLassoSelection = jest.fn();
const mockOnZoomOrPan = jest.fn();

const defaultProps = {
  experimentId,
  config: initialPlotConfigStates[plotTypes.TRAJECTORY_ANALYSIS],
  plotState: mockPlotState,
  plotData: mockStartingNodes,
  plotLoading: false,
  plotDataError: false,
  onPlotDataErrorRetry: mockOnPlotDataErrorRetry,
  actions: false,
  onUpdate: mockOnUpdate,
  onClickNode: mockOnClickNode,
  onLassoSelection: mockOnLassoSelection,
  onZoomOrPan: mockOnZoomOrPan,
};

const trajectoryAnalysisPlotFactory = createTestComponentFactory(
  TrajectoryAnalysisPlot, defaultProps,
);

const renderTrajectoryAnalysisPlot = async (store, props) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {trajectoryAnalysisPlotFactory(props)}
      </Provider>,
    );
  });
};

const defaultShownPlotDescription = 'Trajectory analysis plot showing clusters with trajectory';

let storeState = null;
describe('Trajectory analysis plot', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultAPIResponse));

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((mockEtag) => mockWorkerResponses[mockEtag]());

    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Renders correctly with data', async () => {
    await renderTrajectoryAnalysisPlot(storeState);

    await waitFor(async () => {
      await expect(screen.getByRole('graphics-document', { name: defaultShownPlotDescription })).toBeInTheDocument();
    });
  });

  it('Shows warning if embedding method is tsne', async () => {
    const tsneSettings = { ...mockProcessingConfig };
    tsneSettings.processingConfig.configureEmbedding.embeddingSettings.method = 'tsne';

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI({
      ...defaultAPIResponse,
      [`experiments/${experimentId}/processingConfig`]: () => promiseResponse(
        JSON.stringify(tsneSettings),
      ),
    }));

    await renderTrajectoryAnalysisPlot(storeState);

    await waitFor(async () => {
      expect(screen.getByText(/The embedding and trajectory below are generated from a UMAP embedding of your data/)).toBeInTheDocument();
      expect(screen.getByRole('graphics-document', { name: defaultShownPlotDescription })).toBeInTheDocument();
    });
  });
});
