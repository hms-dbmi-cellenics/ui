import React from 'react';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { makeStore } from 'redux/store';

import DiffExprCompute from 'components/data-exploration/differential-expression-tool/DiffExprCompute';
import { loadCellSets, deleteCellSet } from 'redux/actions/cellSets';
import initialCellsetsState from 'redux/reducers/cellSets/initialState';
import initialDiffExprState from 'redux/reducers/differentialExpression/initialState';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';

enableFetchMocks();

const createMockStore = configureMockStore([thunk]);

const mockOnCompute = jest.fn();
const experimentId = fake.EXPERIMENT_ID;
const defaultProps = {
  experimentId,
  onCompute: mockOnCompute,
};
const DiffExprComputeFactory = createTestComponentFactory(DiffExprCompute, defaultProps);

const mockAPIresponses = generateDefaultMockAPIResponses(experimentId);

const renderDiffExprCompute = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {DiffExprComputeFactory()}
      </Provider>,
    );
  });
};

let storeState = null;

describe('DiffExprCompute', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIresponses));

    storeState = makeStore();
    await storeState.dispatch(loadCellSets(experimentId));
  });

  it('Renders correctly with no comparison method', async () => {
    await renderDiffExprCompute(storeState);

    // Should show radio buttons to choose from
    expect(screen.getByText(/Compare cell sets within a sample\/group/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare a selected cell set between samples\/groups/i)).toBeInTheDocument();

    // Should show the "within" group comparison first
    expect(screen.getByText(/Compare cell set:/i)).toBeInTheDocument();
    expect(screen.getByText(/and cell set:/i)).toBeInTheDocument();
    expect(screen.getByText(/within sample\/group:/i)).toBeInTheDocument();

    // And show "between" groups comparison after changing the radio button
    userEvent.click(screen.getByText('Compare a selected cell set between samples/groups'));

    expect(screen.getByText(/Compare cell set:/i)).toBeInTheDocument();
    expect(screen.getByText(/between sample\/group:/i)).toBeInTheDocument();
    expect(screen.getByText(/and sample\/group:/i)).toBeInTheDocument();

    // Button should be disabled
    expect(screen.getByText(/Compute/i)).toBeInTheDocument();
    expect(screen.getByText(/Compute/i).closest('button')).toBeDisabled();
  });

  it('Option to compare between groups should be disabled if there is only one sample', async () => {
    const oneSampleState = {
      differentialExpression: initialDiffExprState,
      cellSets: {
        ...initialCellsetsState,
        properties: {
          louvain: {
            name: 'Louvain clusters',
            key: 'louvain',
            type: 'cellSets',
            cellIds: new Set(),
            rootNode: true,
          },
          'cluster-a': {
            name: 'cluster a',
            key: 'cluster-a',
            cellIds: new Set([1, 2]),
            color: '#00FF00',
          },
          sample: {
            name: 'Samples',
            key: 'sample',
            type: 'metadataCategorical',
            cellIds: new Set(),
            rootNode: true,
          },
          'sample-a': {
            name: 'sample a',
            key: 'sample-a',
            cellIds: new Set([1, 2]),
            color: '#00FF00',
          },
        },
        hierarchy: [
          {
            key: 'louvain',
            children: [{ key: 'cluster-a' }],
          },
          {
            key: 'sample',
            children: [{ key: 'sample-a' }],
          },
        ],
      },
    };

    await renderDiffExprCompute(createMockStore(oneSampleState));

    // Get the input radio button element for the selection
    const withinRadioButton = screen.getByText(/Compare cell sets within a sample\/group/i)
      .closest('label').querySelector("input[type='radio']");

    expect(withinRadioButton).toBeEnabled();

    const betweenRadioButton = screen.getByText(/Compare a selected cell set between samples\/groups/i)
      .closest('label').querySelector("input[type='radio']");

    expect(betweenRadioButton).toBeDisabled();
  });

  it('Compute button should be enabled if all the options are chosen', async () => {
    await renderDiffExprCompute(storeState);

    // Choose cell set 1
    const selectCellSet1 = screen.getByRole('combobox', { name: /Compare cell set/i });
    userEvent.click(selectCellSet1);
    userEvent.click(screen.getByText('Cluster 0'));

    // Select the 2nd cell set
    const selectCellSet2 = screen.getByRole('combobox', { name: /and cell set:/ });
    userEvent.click(selectCellSet2);
    userEvent.click(screen.getByText('All other cells'));

    // With all samples
    const selectSampleOrGroup = screen.getByRole('combobox', { name: /within sample/i });
    userEvent.click(selectSampleOrGroup);
    userEvent.click(screen.getByText('WT1'));

    // Compute button should be enabled
    await waitFor(() => {
      expect(screen.getByText(/Compute/i).closest('button')).not.toBeDisabled();
    });

    // Run the comparison
    userEvent.click(screen.getByText(/Compute/i).closest('button'));

    await waitFor(() => {
      expect(mockOnCompute).toHaveBeenCalledTimes(1);
    });
  });

  it('Should show warning if there are not enough cell sets to show ', async () => {
    await renderDiffExprCompute(storeState);

    // Select compare between groups
    userEvent.click(screen.getByText('Compare a selected cell set between samples/groups'));

    // Choose cell set
    const selectCellSet = screen.getByRole('combobox', { name: /Compare cell set/i });
    userEvent.click(selectCellSet);
    userEvent.click(screen.getByText(/Cluster 1/));

    // Select the 1st group
    const selectGroup1 = screen.getByRole('combobox', { name: /between sample\/group/i });
    userEvent.click(selectGroup1);
    userEvent.click(screen.getByText(/KO/));

    // Select the 2nd group
    const selectGroup2 = screen.getByRole('combobox', { name: /and sample\/group/i });
    userEvent.click(selectGroup2);

    const group2Option = screen.queryAllByText(/WT1/)[1];
    userEvent.click(group2Option);

    // There should be a warning
    await waitFor(() => {
      expect(screen.getByText(/fewer than 3 samples with the minimum number of cells/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Compute/i).closest('button')).not.toBeDisabled();
    });
  });

  it('Should show error if there are not enough cell sets for comparison', async () => {
    await renderDiffExprCompute(storeState);

    // Select compare between groups
    userEvent.click(screen.getByText('Compare a selected cell set between samples/groups'));

    // Choose cell set
    const selectCellSet = screen.getByRole('combobox', { name: /Compare cell set/i });
    userEvent.click(selectCellSet);
    userEvent.click(screen.getByText(/Cluster 0/));

    // Select the 1st group
    const selectGroup1 = screen.getByRole('combobox', { name: /between sample\/group/i });
    userEvent.click(selectGroup1);
    userEvent.click(screen.getByText(/WT1/));

    // Select the 2nd group
    const selectGroup2 = screen.getByRole('combobox', { name: /and sample\/group/i });
    userEvent.click(selectGroup2);
    userEvent.click(screen.getByText(/Rest of Samples/));

    // There should be an error message
    await waitFor(() => {
      expect(screen.getByText(/does not contain enough cells/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Compute/i).closest('button')).toBeDisabled();
    });
  });

  it('There should be no warning if there are enough cell for comparison', async () => {
    await renderDiffExprCompute(storeState);

    // Select compare between groups
    userEvent.click(screen.getByText('Compare a selected cell set between samples/groups'));

    // Choose cell set
    const selectCellSet = screen.getByRole('combobox', { name: /Compare cell set/i });
    userEvent.click(selectCellSet);
    userEvent.click(screen.getByText(/All/));

    // Select the 1st group
    const selectGroup1 = screen.getByRole('combobox', { name: /between sample\/group/i });
    userEvent.click(selectGroup1);
    userEvent.click(screen.getByText(/WT1/));

    // Select the 2nd group
    const selectGroup2 = screen.getByRole('combobox', { name: /and sample\/group/i });
    userEvent.click(selectGroup2);
    userEvent.click(screen.getByText(/Rest of Samples/));

    await act(async () => {
      fireEvent.change(selectGroup2, { target: { value: 'Rest of Samples' } });
    });

    // There should not be a warning and button should be enabled
    waitFor(() => {
      expect(screen.queryByText(/does not contain enough cells/i)).toBeNull();
      expect(screen.getByText(/Compute/i).closest('button')).not.toBeDisabled();
    });
  });

  it('Choosing cell set from different groups will disable the compute button', async () => {
    const selectionBoxDivParentSelector = "div[class='ant-select-selector']";
    const selectionBoxPlaceholderSelector = "span[class='ant-select-selection-placeholder']";
    const selectionBoxItemSelector = "span[class='ant-select-selection-item']";

    await renderDiffExprCompute(storeState);

    // Choose cell set 1
    const selectCellSet1 = screen.getByRole('combobox', { name: /Compare cell set/i });
    userEvent.click(selectCellSet1);
    userEvent.click(screen.getByText(/Cluster 0/));

    // Select the 2nd cell set
    const selectCellSet2 = screen.getByRole('combobox', { name: /and cell set/i });
    userEvent.click(selectCellSet2);

    screen.debug(null, Infinity);

    // There are 2 'Cluster 2' options because we have 2 cell set dropdowns
    // Choose the 2nd one.
    const cellSet2Option = screen.getAllByText(/Cluster 2/)[1];
    userEvent.click(cellSet2Option);

    // With all samples
    const selectSampleOrGroup = screen.getByRole('combobox', { name: /within sample/i });
    userEvent.click(selectSampleOrGroup);
    userEvent.click(screen.getByText(/WT1/));

    // Delete the cell set delected in the first option
    await act(async () => {
      await storeState.dispatch(deleteCellSet(experimentId, 'louvain-0'));
    });

    // We have to query the HTML elements and check the containing text directly
    // because Antd does not directly store the selection values in the value attribue of the input element
    const cellSet1Selection = selectCellSet1.closest(selectionBoxDivParentSelector);
    const cellSet2Selection = selectCellSet2.closest(selectionBoxDivParentSelector);
    const sampleOrGroupSelection = selectSampleOrGroup.closest(selectionBoxDivParentSelector);

    // The first cell set should show the placeholder
    expect(cellSet1Selection.querySelector(selectionBoxItemSelector)).toBeNull();
    expect(cellSet1Selection.querySelector(selectionBoxPlaceholderSelector)).toHaveTextContent(/Select a cell set.../i);

    // The other options should still be the same
    expect(cellSet2Selection.querySelector(selectionBoxItemSelector)).toHaveTextContent(/Cluster 2/i);
    expect(sampleOrGroupSelection.querySelector(selectionBoxItemSelector)).toHaveTextContent(/WT1/);
  });
});
