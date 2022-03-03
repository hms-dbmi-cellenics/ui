import React from 'react';
import { screen, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { act } from 'react-dom/test-utils';

import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import mockEmbedding from '__test__/data/embedding.json';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import { loadBackendStatus } from 'redux/actions/backendStatus';

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

const defaultProps = {
  experimentId,
  config: initialPlotConfigStates.embeddingCategorical,
  actions: true,
  onUpdate: jest.fn(),
};

const categoricalEmbeddingPlotFactory = createTestComponentFactory(
  CategoricalEmbeddingPlot, defaultProps,
);

const renderCategoricalEmbeddingPlot = async (store, props) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {categoricalEmbeddingPlotFactory(props)}
      </Provider>,
    );
  });
};

let storeState = null;
describe('Categorical embedding plot', () => {
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
    await renderCategoricalEmbeddingPlot(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });

  // it.only('Shows a loader if there is no config', async () => {
  //   const emptyConfig = {
  //     config: {},
  //   };

  //   await renderCategoricalEmbeddingPlot(storeState, emptyConfig);

  //   expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
  //   expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  // });
});
