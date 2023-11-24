import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';

import mockAPI, {
  generateDefaultMockAPIResponses, promiseResponse, statusResponse,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import mockEmbedding from '__test__/data/embedding.json';
import mockStartingNodes from '__test__/data/starting_nodes.json';
import mockProcessingConfig from '__test__/data/processing_config.json';

import fetchWork from 'utils/work/fetchWork';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadPlotConfig } from 'redux/actions/componentConfig';
import getTrajectoryPlotStartingNodes from 'redux/actions/componentConfig/getTrajectoryPlotStartingNodes';

import _ from 'lodash';

import { plotTypes } from 'utils/constants';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadEmbedding } from 'redux/actions/embedding';

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;

jest.mock('utils/work/fetchWork');

const mockWorkerResponses = {
  GetTrajectoryAnalysisStartingNodes: mockStartingNodes,
  GetEmbedding: mockEmbedding,
};

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const customAPIResponses = {
  [`/plots/${plotUuid}$`]: (req) => {
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

const plotDescriptionWithoutData = 'Trajectory analysis plot showing clusters';
const plotDescriptionWithData = 'Trajectory analysis plot showing clusters with trajectory';

let storeState = null;
describe('Trajectory analysis plot', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultAPIResponse));

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => mockWorkerResponses[body.name]);

    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(experimentId));
    await storeState.dispatch(loadProcessingSettings(experimentId));
    await storeState.dispatch(loadEmbedding(experimentId, 'umap'));
    await storeState.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  });

  it('Renders correctly without starting nodes data', async () => {
    await renderTrajectoryAnalysisPlot(storeState);

    await waitFor(async () => {
      await expect(screen.getByRole('graphics-document', { name: plotDescriptionWithoutData })).toBeInTheDocument();
    });
  });

  it('Renders correctly with starting nodes data', async () => {
    await storeState.dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));

    await renderTrajectoryAnalysisPlot(storeState);

    await waitFor(async () => {
      await expect(screen.getByRole('graphics-document', { name: plotDescriptionWithData })).toBeInTheDocument();
    });
  });

  it('Shows warning if embedding method is tsne', async () => {
    const tsneSettings = { ...mockProcessingConfig };
    tsneSettings.processingConfig.configureEmbedding.embeddingSettings.method = 'tsne';

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI({
      ...defaultAPIResponse,
      [`experiments/${experimentId}/processingConfig$`]: () => promiseResponse(
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
      expect(screen.getByRole('graphics-document', { name: plotDescriptionWithData })).toBeInTheDocument();
    });
  });
});
