import React from 'react';
import { Provider } from 'react-redux';
import '__test__/test-utils/setupTests';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import DataIntegration from 'components/data-processing/DataIntegration/DataIntegration';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadCellSets } from 'redux/actions/cellSets';

const embeddingsPlotUuid = generateDataProcessingPlotUuid(null, 'configureEmbedding', 1);
const elbowPlotUuid = generateDataProcessingPlotUuid(null, 'dataIntegration', 1);
const frequencyPlotUuid = 'dataIntegrationFrequency';

const embeddingsPlotTitle = 'Embedding coloured by sample';
const elbowPlotTitle = 'Elbow plot showing principal components';
const frequencyPlotTitle = 'Frequency plot coloured by sample';

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
};

let storeState = null;

const renderDataIntegration = async (store) => await render(
  <Provider store={store}>
    <DataIntegration
      experimentId={fake.EXPERIMENT_ID}
      onPipelineRun={jest.fn()}
      onConfigChange={jest.fn()}
    />
  </Provider>,
);

const customAPIResponses = {
  [`/plots/${embeddingsPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${elbowPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`/plots/${frequencyPlotUuid}`]: () => statusResponse(404, 'Not Found'),
  [`experiments/${fake.EXPERIMENT_ID}/backendStatus`]: () => promiseResponse(
    JSON.stringify({
      pipeline: { status: 'SUCCEEDED', completedSteps: ['ConfigureEmbedding'] },
      worker: { status: 'Running', started: true, ready: true },
    }),
  ),
};

const mockApiResponses = _.merge(
  generateDefaultMockAPIResponses(fake.EXPERIMENT_ID), customAPIResponses,
);

describe('DataIntegration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));
    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(fake.EXPERIMENT_ID));
    await storeState.dispatch(loadProcessingSettings(fake.EXPERIMENT_ID));
    await storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));
  });

  it('renders correctly', async () => {
    await renderDataIntegration(storeState);

    expect(screen.getByText('Plot view')).toBeDefined();
    expect(screen.getByText('Data Integration')).toBeDefined();
    expect(screen.getByText('Downsampling Options')).toBeDefined();
    expect(screen.getByText('Plot styling')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });
  });

  it('allows selecting other plots', async () => {
    await renderDataIntegration(storeState);
    const plots = [frequencyPlotTitle, elbowPlotTitle, embeddingsPlotTitle];

    plots.forEach((plot) => {
      userEvent.click(screen.getByText(plot));
      // check that there are two elements with the plot name:
      // * the main plot title
      // * the plot view selector
      expect(screen.getAllByText(plot).length).toEqual(2);
    });
  });

  it('doesnt show plots that depend on configure embedding if it hasnt finished running yet', async () => {
    const emptyCompletedSteps = {
      pipeline: {
        status: 'SUCCEEDED',
        completedSteps: [],
      },
      worker: {
        status: 'Running',
        started: true,
        ready: true,
      },
    };

    const modifiedResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/backendStatus`]: () => promiseResponse(
        JSON.stringify(emptyCompletedSteps),
      ),
    };

    fetchMock.mockIf(/.*/, mockAPI(modifiedResponse));

    await renderDataIntegration(storeState);

    // embeddings & frequency plots depend on configure embeddings, if the step
    // has not been completed they both should show the mssage "Nothing to show yet"
    // we don't have to click the embedding as it's shown by default
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();

    userEvent.click(screen.getByText(frequencyPlotTitle));
    expect(screen.queryByText('Nothing to show yet')).toBeInTheDocument();

    // elbow plot does not depend on the configure embedding step
    userEvent.click(screen.getByText(elbowPlotTitle));

    // The elbow plot should appear
    await waitFor(() => {
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });
  });

  it('doesnt crash if backend status is null', async () => {
    const modifiedResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/backendStatus`]: () => promiseResponse(null),
    };

    fetchMock.mockIf(/.*/, mockAPI(modifiedResponse));

    await renderDataIntegration(storeState);

    expect(screen.getByText('Plot view')).toBeDefined();
    expect(screen.getByText('Data Integration')).toBeDefined();
    expect(screen.getByText('Plot styling')).toBeDefined();

    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
  });

  it('Renders a plot legend alert if there are more than MAX_LEGEND_ITEMS number of cell sets', async () => {
    const sampleTemplate = (clusterIdx) => ({
      key: `sample-${clusterIdx}`,
      name: `Sample ${clusterIdx}`,
      color: '#000000',
      cellIds: [clusterIdx],
    });

    const manySamples = [...Array(MAX_LEGEND_ITEMS + 1)].map((c, idx) => sampleTemplate(idx));

    // Add to samples
    cellSetsData.cellSets[2].children = manySamples;

    const manySamplesResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => promiseResponse(JSON.stringify(cellSetsData)),
    };

    storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID, true));

    fetchMock.mockIf(/.*/, mockAPI(manySamplesResponse));

    await renderDataIntegration(storeState);

    // Vega should appear
    await waitFor(() => {
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    // The legend alert plot text should appear
    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeInTheDocument();
  });
});
