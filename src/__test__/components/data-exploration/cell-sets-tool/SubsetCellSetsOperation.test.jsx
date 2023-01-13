import React from 'react';
import {
  render, screen, waitFor,
} from '@testing-library/react';

import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

import userEvent from '@testing-library/user-event';
import SubsetCellSetsOperation from 'components/data-exploration/cell-sets-tool/SubsetCellSetsOperation';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const storeState = makeStore();

const mockOnCreate = jest.fn();
const SubsetCellSetsOperationFactory = createTestComponentFactory(
  SubsetCellSetsOperation,
  { onCreate: mockOnCreate },
);

describe('SubsetCellSetsOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders properly', async () => {
    render(
      <Provider store={storeState}>
        {SubsetCellSetsOperationFactory()}
      </Provider>,
    );

    const button = screen.getByLabelText(/Create new experiment from selected cellsets/i);

    expect(button).toBeInTheDocument();

    // Hovering should show correct tooltip
    userEvent.hover(button);

    await waitFor(() => {
      expect(screen.getByText(/Subset selected cell sets to a new project./i));
    });

    // Should not show modal by default
    expect(screen.queryByText(/New project name/i)).toBeNull();
  });

  it('Shows modal when button is clicked', async () => {
    render(
      <Provider store={storeState}>
        {SubsetCellSetsOperationFactory()}
      </Provider>,
    );

    const button = screen.getByLabelText(/Create new experiment from selected cellsets/i);

    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/New project name/i)).toBeInTheDocument();
    });
  });

  it('Clicking on Create closes the modal', async () => {
    render(
      <Provider store={storeState}>
        {SubsetCellSetsOperationFactory()}
      </Provider>,
    );

    const button = screen.getByLabelText(/Create new experiment from selected cellsets/i);

    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/New project name/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Create'));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/New project name/i)).toBeNull();
    });

    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('Clicking on Cancel closes the modal', async () => {
    render(
      <Provider store={storeState}>
        {SubsetCellSetsOperationFactory()}
      </Provider>,
    );

    const button = screen.getByLabelText(/Create new experiment from selected cellsets/i);

    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/New project name/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Cancel'));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/New project name/i)).toBeNull();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });
});
