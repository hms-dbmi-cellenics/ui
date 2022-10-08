import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { seekFromS3 } from 'utils/work/seekWorkResponse';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import mockAPI, { generateDefaultMockAPIResponses, statusResponse, delayedResponse } from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import mockEmbedding from '__test__/data/embedding.json';
import mockGeneExpression from '__test__/data/gene_expression.json';

import WorkResponseError from 'utils/errors/http/WorkResponseError';
import { getExpressionMatrixFromWorkResult } from '__test__/utils/ExpressionMatrix/testMatrixes';

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

const defaultAPIResponse = generateDefaultMockAPIResponses(experimentId);

const matrix = getExpressionMatrixFromWorkResult(mockGeneExpression);
const truncatedPlotData = matrix.getTruncatedExpression('TestGene');
const plotData = matrix.getRawExpression('TestGene');

const defaultProps = {
  experimentId,
  config: initialPlotConfigStates.embeddingContinuous,
  actions: false,
  plotData,
  truncatedPlotData,
  loading: false,
  error: false,
  reloadPlotData: jest.fn(),
  onUpdate: jest.fn(),
};

const continuousEmbeddingPlotFactory = createTestComponentFactory(
  ContinuousEmbeddingPlot, defaultProps,
);

const renderContinuousEmbeddingPlot = async (store, props) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {continuousEmbeddingPlotFactory(props)}
      </Provider>,
    );
  });
};

let storeState = null;
describe('Continuous embedding plot', () => {
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
    await renderContinuousEmbeddingPlot(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeInTheDocument();
  });

  it('Shows a loader if there is no config', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <ContinuousEmbeddingPlot experimentId={experimentId} config={null} />
        </Provider>,
      );
    });

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });

  it('Shows a loader if the plot data is still loading', async () => {
    await renderContinuousEmbeddingPlot(storeState, {
      loading: true,
    });

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });

  it('Shows an error if the plot data has an error', async () => {
    await renderContinuousEmbeddingPlot(storeState, {
      error: true,
    });

    expect(screen.getByText(/We're sorry, we couldn't load this/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });

  it('Shows a loader if cell sets is loading', async () => {
    const cellSetErrorResponse = {
      ...defaultAPIResponse,
      [`experiments/${experimentId}/cellSets`]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetErrorResponse));

    await renderContinuousEmbeddingPlot(storeState);

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });

  it('Shows an error if fetching cell sets throw an error', async () => {
    const cellSetErrorResponse = {
      ...defaultAPIResponse,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(500, 'some random error'),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetErrorResponse));

    await renderContinuousEmbeddingPlot(storeState);

    expect(screen.getByText(/We're sorry, we couldn't load this/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });

  it('Shows a loader if embedding data is loading', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => delayedResponse({ body: 'Not found', status: 404 }, 4000));

    await renderContinuousEmbeddingPlot(storeState);

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });

  it('Shows an error if there is an error fetching embedding', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => Promise.reject(new WorkResponseError('some random error')));

    await renderContinuousEmbeddingPlot(storeState);

    expect(screen.getByText(/We're sorry, we couldn't load this/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Continuous embedding plot' })).toBeNull();
  });
});
