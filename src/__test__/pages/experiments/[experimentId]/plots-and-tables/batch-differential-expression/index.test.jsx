import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import BatchDiffExpression from 'pages/experiments/[experimentId]/plots-and-tables/batch-differential-expression/index';
import fake from '__test__/test-utils/constants';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';
import mockAPI, { generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import * as getBatchDiffExpr from 'utils/extraActionCreators/differentialExpression/getBatchDiffExpr';
import * as checkCanRunDiffExprModule from 'utils/extraActionCreators/differentialExpression/checkCanRunDiffExpr';
import mockLoader from 'components/Loader';

import cellSetsData from '__test__/data/cell_sets.json';
import cellLevelCellSets from '__test__/data/cell_level_cell_sets.json';

jest.spyOn(checkCanRunDiffExprModule, 'default').mockImplementation(() => 'TRUE');
jest.mock('utils/extraActionCreators/differentialExpression/getBatchDiffExpr');
jest.mock('components/Loader', () => jest.fn(() => <div data-testid='mockLoader'>Mock Loader</div>));

describe('Batch differential expression tests ', () => {
  let storeState = null;

  const customCellSetsData = _.cloneDeep(cellSetsData);
  // Add the cell level cell sets
  customCellSetsData.cellSets.push(...cellLevelCellSets);

  const mockApiResponses = {
    ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
    [`experiments/${fake.EXPERIMENT_ID}/cellSets$`]: () => promiseResponse(JSON.stringify(customCellSetsData)),
  };

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

  const secondOptionText = 'Compare between two selected samples/groups in a cell set for all cell sets';
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

    const compareBetweenSamplesRadio = screen.getByLabelText(secondOptionText);
    const compareBetweenCellSetsRadio = screen.getByLabelText(/Compare two cell sets for all samples\/groups/i);

    expect(screen.getByText(/Select the cell sets for which marker genes are to be computed in batch:/i)).toBeInTheDocument();
    expect(screen.getByText('Select a cell set...')).toBeInTheDocument();

    await act(() => userEvent.click(screen.getByText('Select a cell set...')));

    const cellBasedClasses = [
      'Fake louvain clusters',
      'Custom cell sets',
      'Some Cell Level Track',
      'Another Cell Level Track'
    ];

    const sampleBasedClasses = [
      'Samples',
      'Track_1',
      'Sample Cell Level Track'
    ];

    const sampleBasedSets = [
      'KO', 'WT1', 'WT2', 'KMeta', 'WMetaT', 'Sample cell level zero', 'Sample cell level one',
    ];

    // Shows the correct cell classes as options
    cellBasedClasses.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    })

    // Doesn't show the samples or sample-based metadata cell classes as options
    sampleBasedClasses.forEach((text) => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    })

    // Check compareBetweenSamplesRadio
    await act(() => userEvent.click(compareBetweenSamplesRadio));
    expect(screen.getByText(/Select the comparison sample\/groups for which batch/i)).toBeInTheDocument();
    expect(screen.getByText(/In batch for each cell set in:/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a cell set.../i)).toBeInTheDocument();

    expect(screen.getAllByText('Select a sample/group...')).toHaveLength(2);
    screen.getAllByText('Select a sample/group...').forEach((match) => {
      expect(match).toBeVisible();
    });

    await act(() => userEvent.click(screen.getAllByText('Select a sample/group...')[0]));

    // Shows the sample options and their classes
    [...sampleBasedSets, ...sampleBasedClasses].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    // Check compareBetweenCellSetsRadio
    await act(() => userEvent.click(compareBetweenCellSetsRadio));
    expect(screen.getByText(/Select the comparison cell sets for which batch/i)).toBeInTheDocument();
    expect(screen.getByText(/In batch for each sample\/group in:/i)).toBeInTheDocument();
    expect(screen.getByText(/Select samples or metadata.../i)).toBeInTheDocument();

    await act(() => userEvent.click(screen.getAllByText('Select a cell set...')[0]));


    const someLouvainCellSets = Array.from({ length: 11 }, (x, index) => `Cluster ${index}`);
    // Shows only some of the louvain options and not the others
    // Because it is a virtual list which only renders the options that enter the
    // options that fit in the display
    [...someLouvainCellSets, 'fake louvain clusters'].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it('sending a request should work', async () => {
    await renderPage();

    const compareForCellSetsRadio = screen.getByLabelText(secondOptionText);
    const disabledComputeButton = screen.getByText(/Compute and Download/).closest('button');

    // Initial state should have the Compute button disabled
    expect(disabledComputeButton).toBeDisabled();

    userEvent.click(compareForCellSetsRadio);

    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns.length).toEqual(3);

    await act(async () => {
      fireEvent.change(dropdowns[0], { target: { value: 'K0' } });
      fireEvent.change(dropdowns[1], { target: { value: 'Rest of Samples' } });
      fireEvent.change(dropdowns[2], { target: { value: 'Fake louvain clusters' } });
    });

    waitFor(() => {
      // The Compute button should now be enabled
      const enabledComputeButton = screen.getByText(/Compute and Download/).closest('button');
      expect(enabledComputeButton).toBeEnabled();
      userEvent.click(enabledComputeButton);

      expect(getBatchDiffExprSpy).toHaveBeenCalledWith('testae48e318dab9a1bd0bexperiment',
        {
          basis: 'louvain',
          cellSet: 'sample/b62028a1-ffa0-4f10-823d-93c9ddb88898',
          compareWith: 'sample/rest',
          comparisonType: 'between',
        }, 'compareForCellSets',
        ['louvain-0', 'louvain-1', 'louvain-2', 'louvain-3', 'louvain-4', 'louvain-5', 'louvain-6', 'louvain-7', 'louvain-8', 'louvain-9', 'louvain-10', 'louvain-11', 'louvain-12', 'louvain-13']);
    });
  });

  it('shows the Loader while fetching data', async () => {
    getBatchDiffExpr.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    }));

    await renderPage();

    const compareForCellSetsRadio = screen.getByLabelText(secondOptionText);
    userEvent.click(compareForCellSetsRadio);

    const computeButton = screen.getByText(/Compute and Download/).closest('button');
    userEvent.click(computeButton);
    expect(mockLoader).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByTestId('mockLoader')).not.toBeInTheDocument();
    });
  });
});
