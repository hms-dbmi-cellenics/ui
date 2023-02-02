import { render, screen, waitFor } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import CategoricalEmbedding from 'pages/experiments/[experimentId]/plots-and-tables/embedding-categorical/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import mockEmbedding from '__test__/data/embedding.json';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
} from '__test__/test-utils/mockAPI';
import cellSetsData from '__test__/data/cell_sets.json';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

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
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'embeddingCategoricalMain';
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

const categoricalEmbeddingPageFactory = createTestComponentFactory(
  CategoricalEmbedding,
  defaultProps,
);

const renderCategoricalEmbeddingPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {categoricalEmbeddingPageFactory()}
      </Provider>,
    )
  ));
};

describe('Categorical embedding plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderCategoricalEmbeddingPage(storeState);

    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Group by/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colour inversion/i)).toBeInTheDocument();
    expect(screen.getByText(/Markers/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
    expect(screen.getByText(/Labels/i)).toBeInTheDocument();
  });

  it('Renders the plots correctly', async () => {
    await renderCategoricalEmbeddingPage(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Categorical embedding plot' })).toBeInTheDocument();
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

    await renderCategoricalEmbeddingPage(storeState);

    // Vega should appear
    await waitFor(() => {
      expect(screen.getByRole('graphics-document', { name: 'Categorical embedding plot' })).toBeInTheDocument();
    });

    // The legend alert plot text should appear
    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeInTheDocument();
  });
});
