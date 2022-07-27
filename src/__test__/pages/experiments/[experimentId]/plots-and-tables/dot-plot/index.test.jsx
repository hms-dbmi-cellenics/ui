import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import { seekFromS3 } from 'utils/work/seekWorkResponse';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from 'redux/actionTypes/experimentSettings';
import paginatedGeneExpressionData from '__test__/data/paginated_gene_expression.json';
import cellSetsDataWithScratchpad from '__test__/data/cell_sets_with_scratchpad.json';
import dotPlotData from '__test__/data/dotplot_plotdata.json';
import userEvent from '@testing-library/user-event';
import { plotNames } from 'utils/constants';
import ExportAsCSV from 'components/plots/ExportAsCSV';

jest.mock('components/plots/ExportAsCSV', () => jest.fn(() => (<></>)));
jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

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
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  'paginated-gene-expression': () => paginatedGeneExpressionData,
  'dot-plot-data': () => dotPlotData,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'dotPlotMain';

const customAPIResponses = {
  [`experiments/${experimentId}/cellSets`]: () => promiseResponse(
    JSON.stringify(cellSetsDataWithScratchpad),
  ),
  [`/plots/${plotUuid}`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };
const dotPlotPageFactory = createTestComponentFactory(DotPlotPage, defaultProps);

const renderDotPlot = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {dotPlotPageFactory()}
      </Provider>,
    );
  });
};

enableFetchMocks();

let storeState = null;

describe('Dot plot page', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      // 1st call to list genes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 2nd call to paginated gene expression
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]());

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));

    storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });
  });

  it('Renders the plot page correctly', async () => {
    await renderDotPlot(storeState);

    // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText(new RegExp(plotNames.DOT_PLOT, 'i'))).toBeInTheDocument();

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

    // csv data is passed correctly
    expect(ExportAsCSV.mock.calls).toMatchSnapshot();
  });

  it('Shows a skeleton if config is not loaded', async () => {
    const noConfigResponse = {
      ...mockAPIResponse,
      [`/plots/${plotUuid}`]: () => delayedResponse({ body: 'Not found', status: 404 }),
    };

    fetchMock.mockIf(/.*/, mockAPI(noConfigResponse));

    await renderDotPlot(storeState);

    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });

  it('Shows an error if there are errors loading cell sets', async () => {
    const cellSetsErrorResponse = {
      ...mockAPIResponse,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(404, 'Nothing found'),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetsErrorResponse));

    await renderDotPlot(storeState);

    expect(screen.getByText(/Error loading cell sets/i)).toBeInTheDocument();
  });

  it('Shows platform error if there are errors fetching the work', async () => {
    const errorResponse = {
      ...mockWorkerResponses,
      'dot-plot-data': () => { throw new Error('error'); },
    };

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => errorResponse[Etag]())
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => errorResponse[Etag]());

    await renderDotPlot(storeState);

    expect(screen.getByText(/Error loading plot data/i)).toBeInTheDocument();
    expect(screen.getByText(/Check the options that you have selected and try again/i)).toBeInTheDocument();
  });

  it('Shows an empty message if there is no data to show in the plot', async () => {
    const emptyResponse = {
      ...mockWorkerResponses,
      'dot-plot-data': () => [],
    };

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => emptyResponse[Etag]())
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => emptyResponse[Etag]());

    await renderDotPlot(storeState);

    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });

  it('Should show a no data error if user is using marker gene and selected filter sets are not represented in more than 1 group in the base cell set', async () => {
    await renderDotPlot(storeState);

    seekFromS3
      .mockReset()
      // 1st call to list genes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 2nd call to load dot plot
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 3nd call to load dot plot
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]());

    // Use marker genes
    await act(async () => {
      userEvent.click(screen.getByText(/Marker genes/i));
    });

    // Select data
    await act(async () => {
      userEvent.click(screen.getByText(/Select data/i));
    });

    // Select samples
    const selectBaseCells = screen.getByRole('combobox', { name: 'selectCellSets' });

    await act(async () => {
      fireEvent.change(selectBaseCells, { target: { value: 'Samples' } });
    });

    const baseOption = screen.getByText(/Samples/);

    await act(async () => {
      fireEvent.click(baseOption);
    });

    // Select the filter sets
    const selectFilterCells = screen.getByRole('combobox', { name: 'selectPoints' });

    await act(async () => {
      fireEvent.change(selectFilterCells, { target: { value: 'Samples' } });
    });

    const filterOption = screen.getByText(/Copied WT2/);

    await act(async () => {
      fireEvent.click(filterOption);
    });

    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/The cell set that you have chosen to display is repesented by only one group/i)).toBeInTheDocument();
    expect(screen.getByText(/A comparison can not be run to determine the top marker genes/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });
});
