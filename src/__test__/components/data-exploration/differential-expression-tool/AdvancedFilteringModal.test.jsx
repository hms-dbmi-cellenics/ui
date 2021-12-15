import React from 'react';
import '@testing-library/jest-dom';
// import userEvent from '@testing-library/user-event';

import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';

describe('Advanced filtering modal', () => {
  const renderAdvancedFilteringModal = () => {
    const onCancel = jest.fn();
    render(<AdvancedFilteringModal onCancel={onCancel} />);
  };

  it('Renders properly', () => {
    renderAdvancedFilteringModal();
    expect(screen.getByText('Add filter')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Preset filters')).toBeInTheDocument();
  });

  it('Add filter button adds new form items', () => {
    renderAdvancedFilteringModal();
    const addFilterButton = screen.getByText('Add filter');
    addFilterButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByPlaceholderText('Insert value')).toBeInTheDocument();
    addFilterButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(4);
    expect(screen.getAllByPlaceholderText('Insert value').length).toEqual(2);
  });

  it('Close button removes items from the list', () => {
    renderAdvancedFilteringModal();
    const addFilterButton = screen.getByText('Add filter');
    addFilterButton.click();
    addFilterButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(4);
    const closeButton = screen.getAllByLabelText('close')[1];
    closeButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
  });

  it('Preset filters button adds a preset filter', async () => {
    renderAdvancedFilteringModal();
    const presetFiltersButton = screen.getByText('Preset filters');
    fireEvent.mouseOver(presetFiltersButton);
    const upregulatedButton = await waitFor(() => screen.getByText('Up-regulated'));
    upregulatedButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByText('logFC')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Insert value').value).toEqual('0');
  });
});
