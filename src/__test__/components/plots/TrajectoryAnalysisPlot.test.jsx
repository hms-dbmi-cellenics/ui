import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';

import mockAPI, { generateDefaultMockAPIResponses, promiseResponse, statusResponse } from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import mockEmbedding from '__test__/data/embedding.json';
import mockStartingNodes from '__test__/data/starting_nodes.json';
import mockProcessingConfig from '__test__/data/processing_config.json';

import { seekFromS3 } from 'utils/work/seekWorkResponse';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadPlotConfig } from 'redux/actions/componentConfig';
import getTrajectoryPlotStartingNodes from 'redux/actions/componentConfig/getTrajectoryPlotStartingNodes';

import _ from 'lodash';

import { plotTypes } from 'utils/constants';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadEmbedding } from 'redux/actions/embedding';

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;

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
  GetTrajectoryAnalysisStartingNodes: mockStartingNodes,
  GetEmbedding: mockEmbedding,
};

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const customAPIResponses = {
  [`/plots/${plotUuid}`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const defaultAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const mockDisplaySettings = {
  showStartingNodes: true,
  showPseudotimeValues: false,
  isZoomedOrPanned: false,
};

const mockOnUpdate = jest.fn();
const mockOnClickNode = jest.fn();
const mockOnLassoSelection = jest.fn();
const mockOnZoomOrPan = jest.fn();

const defaultProps = {
  experimentId,
  plotUuid,
  displaySettings: mockDisplaySettings,
  actions: false,
  onUpdate: mockOnUpdate,
  onClickNode: mockOnClickNode,
  onLassoSelection: mockOnLassoSelection,
  onZoomOrPan: mockOnZoomOrPan,
  resetZoomCount: 0,
  ref: { current: { xdom: [-1, 1], ydom: [-1, 1] } },
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

    let toggleReturnNull = true;

    seekFromS3
      .mockReset()
      .mockImplementation((mockETag) => {
        const result = toggleReturnNull ? null : mockWorkerResponses[mockETag];
        toggleReturnNull = !toggleReturnNull;
        return result;
      });

    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(experimentId));
    await storeState.dispatch(loadProcessingSettings(experimentId));
    await storeState.dispatch(loadEmbedding(experimentId, 'umap'));
    await storeState.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    await storeState.dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));
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

    const tsneStore = makeStore();
    await tsneStore.dispatch(loadBackendStatus(experimentId));
    await tsneStore.dispatch(loadProcessingSettings(experimentId));
    await tsneStore.dispatch(loadEmbedding(experimentId, 'tsne'));
    await tsneStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    await tsneStore.dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));

    await renderTrajectoryAnalysisPlot(tsneStore);

    await waitFor(async () => {
      expect(screen.getByText(/The embedding and trajectory below are generated from a UMAP embedding of your data/)).toBeInTheDocument();
      expect(screen.getByRole('graphics-document', { name: defaultShownPlotDescription })).toBeInTheDocument();
    });
  });
});
