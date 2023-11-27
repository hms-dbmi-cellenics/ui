import React from 'react';

import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';

import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import volcanoPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/volcano';

import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import mockDiffExprResult from '__test__/data/differential_expression_0_All_WT1.json';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import fetchWork from 'utils/work/fetchWork';

import { plotNames } from 'utils/constants';

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'volcanoPlotMain';
const defaultProps = { experimentId };

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

jest.mock('utils/work/fetchWork');

jest.mock('@aws-amplify/auth', () => ({}));

const mockWorkerResponses = {
  DifferentialExpression: mockDiffExprResult,
};

const customAPIResponses = {
  [`/plots/${plotUuid}$`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const volcanoPlotPageFactory = createTestComponentFactory(volcanoPlotPage, defaultProps);
const renderVolcanoPlotPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {volcanoPlotPageFactory()}
      </Provider>,
    )
  ));
};

let storeState = null;

const runComparison = async () => {
  // Choose cell set 1
  const selectCellSet1 = screen.getByRole('combobox', { name: /Compare cell set/i });
  userEvent.click(selectCellSet1);
  userEvent.click(screen.getByText(/Cluster 0/));

  // Select the 2nd cell set
  const selectCellSet2 = screen.getByRole('combobox', { name: /and cell set/i });
  userEvent.click(selectCellSet2);
  userEvent.click(screen.getByText(/All other cells/));

  // With all samples
  const selectSampleOrGroup = screen.getByRole('combobox', { name: /within sample/i });
  userEvent.click(selectSampleOrGroup);
  userEvent.click(screen.getByText(/WT1/));

  // Run the comparison
  await act(async () => {
    userEvent.click(screen.getByText(/Compute/i));
  });
};

describe('Volcano plot page', () => {
  beforeEach(async () => {
    fetchWork.mockClear();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => mockWorkerResponses[body.name]);

    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderVolcanoPlotPage(storeState);

    expect(screen.getByText(new RegExp(plotNames.VOLCANO_PLOT, 'i'))).toBeInTheDocument();

    expect(screen.getByText(/Differential expression/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Data thresholding/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Markers/i)).toBeInTheDocument();
    expect(screen.getByText(/Add labels/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
    expect(screen.getByText(/Export as CSV/i)).toBeInTheDocument();
  });

  it('Asks the user to make comparison to get started', async () => {
    await renderVolcanoPlotPage(storeState);

    expect(screen.getByText(/Create a comparison to get started/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();
  });

  it('Loads the plot when user has made comparisons', async () => {
    await renderVolcanoPlotPage(storeState);

    await runComparison();

    // The plot should show up
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();

    // The CSV download button should be enabled
    const csvButton = screen.getByText(/Export as CSV/i).closest('button');
    expect(csvButton).toBeEnabled();
  });

  it('Shows loader if diff expression is still loading', async () => {
    fetchWork
      .mockReset()
      .mockImplementationOnce(() => delayedResponse({ body: 'Not found', status: 404 }));

    await renderVolcanoPlotPage(storeState);

    await runComparison();

    expect(screen.getByText(/Assigning a worker to your analysis/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    // The CSV download button should be disabled
    const csvButton = screen.getByText(/Export as CSV/i).closest('button');
    expect(csvButton).toBeDisabled();
  });

  it('Shows platform error if loading diff expression result failed ', async () => {
    fetchWork
      .mockReset()
      // TODO this is weird, take a look later
      .mockImplementationOnce(() => promiseResponse('Not Found', 404));

    await renderVolcanoPlotPage(storeState);

    await runComparison();

    expect(screen.getByText(/Could not load differential expression data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    // The CSV download button should be disabled
    const csvButton = screen.getByText(/Export as CSV/i).closest('button');
    expect(csvButton).toBeDisabled();
  });
});
