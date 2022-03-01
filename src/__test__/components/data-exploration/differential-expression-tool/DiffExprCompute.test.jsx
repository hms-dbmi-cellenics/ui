import React from 'react';
import { Provider } from 'react-redux';
import DiffExprCompute from 'components/data-exploration/differential-expression-tool/DiffExprCompute';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { act } from 'react-dom/test-utils';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeStore } from 'redux/store';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';
import { loadCellSets } from 'redux/actions/cellSets';

enableFetchMocks();

const mockOnCompute = jest.fn();
const experimentId = fake.EXPERIMENT_ID;

const defaultProps = {
  experimentId,
  onCompute: mockOnCompute,
};
const DiffExprComputeFactory = createTestComponentFactory(DiffExprCompute, defaultProps);

const mockAPIresponses = generateDefaultMockAPIResponses(experimentId);

const renderDiffExprCompute = async (store) => {
  await act(() => {
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

  it.only('Compute button should be enabled if all the options are chosen', async () => {
    await renderDiffExprCompute(storeState);

    // Choose cell set 1
    const selectCellSet1 = screen.getByRole('combobox', { name: /Compare cell set/i });
    await act(async () => {
      fireEvent.change(selectCellSet1, { target: { value: 'Cluster 0' } });
    });

    const cellSet1Option = screen.getByText(/Cluster 0/);
    await act(async () => {
      fireEvent.click(cellSet1Option);
    });

    // Select the 2nd cell set
    const selectCellSet2 = screen.getByRole('combobox', { name: /and cell set/i });
    await act(async () => {
      fireEvent.change(selectCellSet2, { target: { value: 'All' } });
    });

    const cellSet2Option = screen.getByText(/All other cells/);
    await act(async () => {
      fireEvent.click(cellSet2Option);
    });

    // With all samples
    const selectSampleOrGroup = screen.getByRole('combobox', { name: /within sample/i });
    await act(async () => {
      fireEvent.change(selectSampleOrGroup, { target: { value: 'WT1' } });
    });

    const sampleOrGroupOption = screen.getByText(/WT1/);
    await act(async () => {
      fireEvent.click(sampleOrGroupOption);
    });

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

  it('Should show warning if there are not enough cell sets for comparison', async () => {
    await renderDiffExprCompute(storeState);

    // Select compare between groups
    userEvent.click(screen.getByText('Compare a selected cell set between samples/groups'));

    // Choose cell set
    const selectCellSet = screen.getByRole('combobox', { name: /Compare cell set/i });
    await act(async () => {
      fireEvent.change(selectCellSet, { target: { value: 'Cluster 0' } });
    });

    const cellSetOption = screen.getByText(/Cluster 0/);
    await act(async () => {
      fireEvent.click(cellSetOption);
    });

    // Select the 1st group
    const selectGroup1 = screen.getByRole('combobox', { name: /between sample\/group/i });
    await act(async () => {
      fireEvent.change(selectGroup1, { target: { value: 'WT1' } });
    });

    const group1Option = screen.getByText(/WT1/);
    await act(async () => {
      fireEvent.click(group1Option);
    });

    // Select the 2nd group
    const selectGroup2 = screen.getByRole('combobox', { name: /and sample\/group/i });
    await act(async () => {
      fireEvent.change(selectGroup2, { target: { value: 'Rest of Samples' } });
    });

    const group2Option = screen.getByText(/Rest of Samples/);
    await act(async () => {
      fireEvent.click(group2Option);
    });

    // There should be a warning
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
    await act(async () => {
      fireEvent.change(selectCellSet, { target: { value: 'All' } });
    });

    const cellSetOption = screen.getByText(/All/);
    await act(async () => {
      fireEvent.click(cellSetOption);
    });

    // Select the 1st group
    const selectGroup1 = screen.getByRole('combobox', { name: /between sample\/group/i });
    await act(async () => {
      fireEvent.change(selectGroup1, { target: { value: 'WT1' } });
    });

    const group1Option = screen.getByText(/WT1/);
    await act(async () => {
      fireEvent.click(group1Option);
    });

    // Select the 2nd group
    const selectGroup2 = screen.getByRole('combobox', { name: /and sample\/group/i });
    await act(async () => {
      fireEvent.change(selectGroup2, { target: { value: 'Rest of Samples' } });
    });

    const group2Option = screen.getByText(/Rest of Samples/);
    await act(async () => {
      fireEvent.click(group2Option);
    });

    // There should not be a warning and button should be enabled
    waitFor(() => {
      expect(screen.queryByText(/does not contain enough cells/i)).toBeNull();
      expect(screen.getByText(/Compute/i).closest('button')).not.toBeDisabled();
    });
  });
});
