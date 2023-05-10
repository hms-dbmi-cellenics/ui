import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';
import {
  render, screen, fireEvent,
} from '@testing-library/react';
import BatchDiffExpression from 'pages/experiments/[experimentId]/plots-and-tables/batch-differential-expression/index';
import fake from '__test__/test-utils/constants';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';
import { selectOption } from '__test__/test-utils/rtlHelpers';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import * as getBatchDiffExpr from 'utils/extraActionCreators/differentialExpression/getBatchDiffExpr';
import * as checkCanRunDiffExprModule from 'utils/extraActionCreators/differentialExpression/checkCanRunDiffExpr';

jest.spyOn(checkCanRunDiffExprModule, 'default').mockImplementation(() => 'TRUE');

describe('Batch differential expression tests ', () => {
  let storeState = null;
  const mockApiResponses = _.merge(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID));
  let getBatchDiffExprSpy;

  beforeEach(async () => {
    jest.clearAllMocks();

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));
    storeState = makeStore();
    getBatchDiffExprSpy = jest.spyOn(getBatchDiffExpr, 'default');
  });

  const renderPage = async () => {
    await act(async () => render(
      <Provider store={storeState}>
        <BatchDiffExpression experimentId={fake.EXPERIMENT_ID} />
      </Provider>,
    ));
  };
  it('Renders correctly', async () => {
    await renderPage();
    expect(screen.getByText(/Select the batch differential expression calculation to perform:/i)).toBeInTheDocument();
    expect(screen.getByText(/Compute/).closest('button')).toBeDisabled();
  });

  it('Shows correct input fields for each comparison option', async () => {
    await renderPage();

    const compareForCellSetsRadio = screen.getByLabelText(/Compare two selected samples\/groups within a cell set for all cell sets/i);
    const compareForSamplesRadio = screen.getByLabelText(/Compare between two cell sets for all samples\/groups/i);

    expect(screen.getByText(/Select the cell sets for which marker genes are to be computed in batch:/i)).toBeInTheDocument();
    expect(screen.getByText('Select a cell set...')).toBeInTheDocument();

    // Check compareForCellSetsRadio
    await act(() => userEvent.click(compareForCellSetsRadio));
    expect(screen.getByText(/Select the comparison sample\/groups for which batch/i)).toBeInTheDocument();
    expect(screen.getByText(/In batch for each cell set in:/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a cell set.../i)).toBeInTheDocument();

    // Check compareForSamplesRadio
    await act(() => userEvent.click(compareForSamplesRadio));
    expect(screen.getByText(/Select the comparison cell sets for which batch/i)).toBeInTheDocument();
    expect(screen.getByText(/In batch for each sample\/group in:/i)).toBeInTheDocument();
    expect(screen.getByText(/Select samples or metadata.../i)).toBeInTheDocument();
  });
  it('sending a request should work', async () => {
    await renderPage();

    const secondOption = screen.getByText('Compare two selected samples/groups within a cell set for all cell sets');
    const computeButton = screen.getByText(/Compute/).closest('button');

    // Initial state should have the Compute button disabled
    expect(computeButton).toBeDisabled();

    // Click the 'Generate a full list of marker genes for all cell sets' option
    await act(() => userEvent.click(secondOption));
    const dropdowns = screen.getAllByRole('combobox');
    expect(computeButton).toBeDisabled();

    await act(async () => {
      await selectOption('KO', dropdowns[0]);
      await selectOption('Rest of Samples', dropdowns[1]);
      await selectOption('Fake louvain clusters', dropdowns[2]);
    });

    // The Compute button should now be enabled
    const button = screen.getByRole('button', { name: /Compute/ });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(getBatchDiffExprSpy).toHaveBeenCalledWith('testae48e318dab9a1bd0bexperiment',
      {
        basis: 'louvain',
        cellSet: 'sample/b62028a1-ffa0-4f10-823d-93c9ddb88898',
        compareWith: 'sample/rest',
        comparisonType: 'within',
      }, 'compareForCellSets',
      ['louvain-0', 'louvain-1', 'louvain-2', 'louvain-3', 'louvain-4', 'louvain-5', 'louvain-6', 'louvain-7', 'louvain-8', 'louvain-9', 'louvain-10', 'louvain-11', 'louvain-12', 'louvain-13']);
  });
});
