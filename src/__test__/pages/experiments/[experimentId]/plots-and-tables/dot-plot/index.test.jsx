import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import { seekFromAPI } from 'utils/work/seekWorkResponse';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';

import paginatedGeneExpressionData from '__test__/data/paginated_gene_expression.json';
import dotPlotData from '__test__/data/dotplot_plotdata.json';

jest.mock('localforage');

jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = (ETagParams) => {
    if (ETagParams.body.name === 'ListGenes') return 'paginated-gene-expression';
    if (ETagParams.body.name === 'DotPlot') return 'dot-plot-data';
  };
  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  seekFromAPI: jest.fn(),
  seekFromS3: () => Promise.resolve(null),
}));

const mockWorkerResponses = {
  'paginated-gene-expression': paginatedGeneExpressionData,
  'dot-plot-data': dotPlotData,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'dotPlotMain';

const customAPIResponses = {
  [`/plots-tables/${plotUuid}`]: () => statusResponse(404, 'Not Found'),
};

const defaultMockResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
  mockWorkerResponses,
);

const defaultProps = { experimentId };
const dotPlotPageFactory = createTestComponentFactory(DotPlotPage, defaultProps);

enableFetchMocks();

let storeState = null;

describe('Dot plot page', () => {
  beforeEach(async () => {
    seekFromAPI.mockClear();
    seekFromAPI.mockImplementation(
      (a, b, c, requested) => Promise.resolve(_.cloneDeep(mockWorkerResponses[requested])),
    );

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultMockResponses));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Renders the plot page correctly', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotPageFactory()}
        </Provider>,
      );
    });

    // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();

    // It has the required dropdown options
    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Size scale/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();

    // It shows the plot
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });

  it('Shows a skeleton if config is not loaded', async () => {
    const noConfigResponse = {
      ...defaultMockResponses,
      [`/plots-tables/${plotUuid}`]: () => delayedResponse({ body: 'Not found', status: 404 }),
    };

    fetchMock.mockIf(/.*/, mockAPI(noConfigResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotPageFactory()}
        </Provider>,
      );
    });

    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });

  it('Shows an error if there are errors loading cell sets', async () => {
    const cellSetsErrorResponse = {
      ...defaultMockResponses,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(404, 'Nothing found'),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetsErrorResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotPageFactory()}
        </Provider>,
      );
    });

    expect(screen.getByText(/Error loading cell sets/i)).toBeInTheDocument();
  });

  it('Shows an empty message if there is no data to show in the plot', async () => {
    const emptyResponseWorkResponse = {
      ...mockWorkerResponses,
      'dot-plot-data': [],
    };

    seekFromAPI.mockImplementation(
      (a, b, c, requested) => Promise.resolve(_.cloneDeep(emptyResponseWorkResponse[requested])),
    );

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotPageFactory()}
        </Provider>,
      );
    });

    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });
});
