import { render, screen, waitFor } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import Heatmap from 'pages/experiments/[experimentId]/plots-and-tables/heatmap/index';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import expressionDataFAKEGENE from '__test__/data/gene_expression_FAKEGENE.json';
import cellSetsWithScratchpad from '__test__/data/cell_sets_with_scratchpad.json';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadGeneExpression } from 'redux/actions/genes';
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
import cellSetsData from '__test__/data/cell_sets.json';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

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

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = (ETagParams) => {
    if (ETagParams.body.name === 'ListGenes') return 'ListGenes';
    return `${ETagParams.body.nGenes}-marker-genes`;
  };

  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  'FAKEGENE-expression': expressionDataFAKEGENE,
};

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

  it('It shows an informative text if there are cell sets to show', async () => {
    await renderHeatmapPage(storeState);

    // Open the Select Data panel
    userEvent.click(screen.getByText(/Select data/i));

    // Change from Louvain to Custom cell sets
    userEvent.click(screen.getByText(/Louvain/i));
    userEvent.click(screen.getByText(/Custom cell sets/i), null, { skipPointerEventsCheck: true });

    expect(updatePlotConfig).toHaveBeenCalled();
    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });

  it('Shows the plot if there are custom clusters to show', async () => {
    const withScratchpadResponse = _.merge(
      generateDefaultMockAPIResponses(experimentId),
      customAPIResponses,
      {
        [`experiments/${experimentId}/cellSets`]: () => promiseResponse(
          JSON.stringify(cellSetsWithScratchpad),
        ),
      },
    );

    fetchMock.mockIf(/.*/, mockAPI(withScratchpadResponse));

    await renderHeatmapPage(storeState);

    // Open the Select Data panel
    userEvent.click(screen.getByText(/Select data/i));

    // Change from Louvain to Custom cell sets
    userEvent.click(screen.getByText(/Louvain/i));
    userEvent.click(screen.getByText(/Custom cell sets/i), null, { skipPointerEventsCheck: true });

    expect(updatePlotConfig).toHaveBeenCalled();
    expect(screen.queryByText(/There is no data to show/i)).toBeNull();
  });

  it('Changing chosen cluster updates the plot data', async () => {
    const withScratchpadResponse = _.merge(
      generateDefaultMockAPIResponses(experimentId),
      customAPIResponses,
      {
        [`experiments/${experimentId}/cellSets`]: () => promiseResponse(
          JSON.stringify(cellSetsWithScratchpad),
        ),
      },
    );

    fetchMock.mockIf(/.*/, mockAPI(withScratchpadResponse));

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

    await renderHeatmapPage(storeState);

    const genesToLoad = ['FAKEGENE'];

    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    // Open the Select Data panel
    userEvent.click(screen.getByText(/Select data/i));

    // Change to display another cell set
    userEvent.click(screen.getByText(/All/i));
    await act(async () => {
      userEvent.click(screen.getByText(/Copied KO/i), null, { skipPointerEventsCheck: true });
    });

    // 2 calls:
    // 1 for the selected gene (loadGeneExpression)
    // 1 for changing the cell set
    expect(updatePlotConfig).toHaveBeenCalledTimes(2);
  });

  it('Renders a plot legend alert if there are more than MAX_LEGEND_ITEMS number of cell sets', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

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

    await renderHeatmapPage(storeState);

    // The legend alert plot text should not appear if no genes are chosen
    await waitFor(() => {
      expect(screen.queryByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeNull();
    });

    const genesToLoad = ['FAKEGENE'];

    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    // The legend alert plot text should appear after the plot has loaded
    await waitFor(() => {
      expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeInTheDocument();
    });
  });
});
