import { render, screen } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import ContinuousEmbedding from 'pages/experiments/[experimentId]/plots-and-tables/embedding-continuous/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import markerGenes1 from '__test__/data/marker_genes_1.json';

import mockEmbedding from '__test__/data/embedding.json';
import paginatedGeneExpressionData from '__test__/data/paginated_gene_expression.json';

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

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag');

  const mockWorkRequestETag = (EtagParams) => `${EtagParams.body.name}`;
  const mockGeneExpressionETag = () => '1-marker-genes';

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  '1-marker-genes': markerGenes1,
  ListGenes: paginatedGeneExpressionData,
  GetEmbedding: mockEmbedding,
};
const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'embeddingContinuousMain';
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

const continuousEmbeddingPageFactory = createTestComponentFactory(
  ContinuousEmbedding,
  defaultProps,
);

const renderContinuousEmbeddingPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {continuousEmbeddingPageFactory()}
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
      .mockImplementation((Etag) => mockWorkerResponses[Etag]);

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderContinuousEmbeddingPage(storeState);

    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Expression values/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Markers/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Renders the plots correctly', async () => {
    await renderContinuousEmbeddingPage(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeInTheDocument();
  });
});
