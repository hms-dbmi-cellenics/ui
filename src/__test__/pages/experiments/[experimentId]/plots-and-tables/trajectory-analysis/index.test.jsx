import { render, screen, waitFor } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import TrajectoryAnalysis from 'pages/experiments/[experimentId]/plots-and-tables/trajectory-analysis/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import mockEmbedding from '__test__/data/embedding.json';
import mockStartingNodes from '__test__/data/starting_nodes.json';

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
  GetStartingNodes: mockStartingNodes,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'trajectoryAnalysisMain';
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

const trajectoryAnalysisPageFactory = createTestComponentFactory(
  TrajectoryAnalysis,
  defaultProps,
);

const renderTrajectoryAnalysisPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {trajectoryAnalysisPageFactory()}
      </Provider>,
    )
  ));
};

describe('Trajectory analysis plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag])
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
    await renderTrajectoryAnalysisPage(storeState);

    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Trajectory analysis')).toBeInTheDocument();
    expect(screen.getByText('Main schema')).toBeInTheDocument();
    expect(screen.getByText('Axes and margins')).toBeInTheDocument();
    expect(screen.getByText('Colours')).toBeInTheDocument();
    expect(screen.getByText('Markers')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
  });

  it('Renders the plot with cluster and trajectory by default', async () => {
    await renderTrajectoryAnalysisPage(storeState);

    await waitFor(async () => {
      expect(screen.getByRole('graphics-document', { name: 'Trajectory analysis plot showing clusters with trajectory' })).toBeInTheDocument();
    });
  });
});
