import React from 'react';
import { Provider } from 'react-redux';
import '__test__/test-utils/setupTests';
import userEvent from '@testing-library/user-event';
import { screen, render, waitFor } from '@testing-library/react';
import _ from 'lodash';
import fake from '__test__/test-utils/constants';
import mockAPI, {
  statusResponse,
  promiseResponse,
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import cellSetsData from '__test__/data/cell_sets.json';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import mockEmbedding from '__test__/data/embedding.json';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadCellSets } from 'redux/actions/cellSets';

import ConfigureEmbedding from 'components/data-processing/ConfigureEmbedding/ConfigureEmbedding';

const filterName = 'configureEmbedding';

const embeddingPreviewByCellSetsPlotUuid = generateDataProcessingPlotUuid(null, filterName, 0);
const embeddingPreviewBySamplePlotUuid = generateDataProcessingPlotUuid(null, filterName, 1);
const embeddingPreviewMitoContentPlotUuid = generateDataProcessingPlotUuid(null, filterName, 2);
const embeddingPreviewDoubletScorePlotUuid = generateDataProcessingPlotUuid(null, filterName, 3);
const embeddingPreviewNumOfGenesPlotUuid = generateDataProcessingPlotUuid(null, filterName, 4);
const embeddingPreviewNumOfUmisPlotUuid = generateDataProcessingPlotUuid(null, filterName, 5);

enableFetchMocks();

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
  GetMitochondrialContent: [1, 2, 3, 4, 5],
  GetDoubletScore: [1, 2, 3, 4, 5],
  GetNGenes: [1, 2, 3, 4, 5],
  GetNUmis: [1, 2, 3, 4, 5],
};

const renderConfigureEmbedding = async (store) => {
  await render(
    <Provider store={store}>
      <ConfigureEmbedding
        experimentId={fake.EXPERIMENT_ID}
        key='configureEmbedding'
        onConfigChange={jest.fn}
      />
    </Provider>,
  );
};

const customAPIResponses = {
  [`/plots/${embeddingPreviewByCellSetsPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${embeddingPreviewBySamplePlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${embeddingPreviewMitoContentPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${embeddingPreviewDoubletScorePlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${embeddingPreviewNumOfGenesPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${embeddingPreviewNumOfUmisPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`experiments/${fake.EXPERIMENT_ID}/backendStatus`]: () => promiseResponse(
    JSON.stringify({
      pipeline: { status: 'SUCCEEDED', completedSteps: ['ConfigureEmbedding'] },
      worker: { status: 'Running', started: true, ready: true },
    }),
  ),
};

let storeState = null;

const mockApiResponses = _.merge(
  generateDefaultMockAPIResponses(fake.EXPERIMENT_ID), customAPIResponses,
);

describe('Configure Embedding', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();

    seekFromS3
      .mockReset()
      // Call for GetEmbedding
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag])
      // Call for GetMitochondrialContent
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag])
      // Call for GetDoubletScore
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag])
      // Call for GetNGenes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag])
      // Call for GetNUmis
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));
    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(fake.EXPERIMENT_ID));
    await storeState.dispatch(loadProcessingSettings(fake.EXPERIMENT_ID));
    await storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));
  });

  it('renders correctly ', async () => {
    await renderConfigureEmbedding(storeState);

    // one fullsize plot rendered
    await waitFor(() => {
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    // styling and settings options available
    expect(screen.getByText('Plot view')).toBeDefined();
    expect(screen.getByText('Embedding settings')).toBeDefined();
    expect(screen.getByText('Clustering settings')).toBeDefined();
    expect(screen.getByText('Plot options')).toBeDefined();

    // additional select data option available
    userEvent.click(screen.getByText('Plot options'));
    expect(screen.getAllByText('Select data')).toBeDefined();
  });

  it('allows selecting other plots', async () => {
    await renderConfigureEmbedding(storeState);

    // can select other plots
    ['Samples', 'Mitochondrial fraction reads', 'Doublet score', 'Cell sets', 'Number of genes', 'Number of UMIs'].forEach((plot) => {
      userEvent.click(screen.getByText(plot));
      // check that there are two elements with the plot name:
      // * the main plot title
      // * the plot view selector
      expect(screen.getAllByText(plot).length).toEqual(2);
    });
  });

  it('Renders a plot legend alert if there are more than MAX_LEGEND_ITEMS number of cell sets', async () => {
    const cellSetTemplate = (clusterIdx) => ({
      key: `louvain-${clusterIdx}`,
      name: `Cluster ${clusterIdx}`,
      rootNode: false,
      type: 'cellSets',
      color: '#000000',
      cellIds: [clusterIdx],
    });

    const manyCellSets = [...Array(MAX_LEGEND_ITEMS + 1)].map((c, idx) => cellSetTemplate(idx));

    // Add to samples
    cellSetsData.cellSets[0].children = manyCellSets;

    const manyCellSetsResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => promiseResponse(JSON.stringify(cellSetsData)),
    };

    storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID, true));

    fetchMock.mockIf(/.*/, mockAPI(manyCellSetsResponse));

    await renderConfigureEmbedding(storeState);

    // Vega should appear
    await waitFor(() => {
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    // The legend alert plot text should appear
    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeInTheDocument();
  });
});
