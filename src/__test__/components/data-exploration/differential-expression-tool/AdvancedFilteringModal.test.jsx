import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';

describe('Advanced filtering modal', () => {
  const onCancel = jest.fn();

  const renderAdvancedFilteringModal = () => {
    render(
      <Provider store={makeStore()}>
        <AdvancedFilteringModal onCancel={onCancel} />
      </Provider>,
    );
  };

  it('Renders properly', () => {
    renderAdvancedFilteringModal();
    expect(screen.getByText('Add custom filter')).toBeInTheDocument();
    expect(screen.getByText('Apply filters')).toBeInTheDocument();
    expect(screen.getByText('Add preset filter')).toBeInTheDocument();
    const closeButton = screen.getAllByLabelText('close')[0];
    closeButton.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('Add filter button adds new form items', () => {
    renderAdvancedFilteringModal();
    const addFilterButton = screen.getByText('Add custom filter');
    addFilterButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByPlaceholderText('Insert value')).toBeInTheDocument();
    addFilterButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(4);
    expect(screen.getAllByPlaceholderText('Insert value').length).toEqual(2);
  });

  it('Close button removes items from the list', () => {
    renderAdvancedFilteringModal();
    const addFilterButton = screen.getByText('Add custom filter');
    addFilterButton.click();
    addFilterButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(4);
    const closeButton = screen.getAllByLabelText('close')[1];
    closeButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
  });

  it('Preset filters button adds a preset filter', async () => {
    renderAdvancedFilteringModal();
    const presetFiltersButton = screen.getByText('Add preset filter');
    fireEvent.mouseOver(presetFiltersButton);
    const upregulatedButton = await waitFor(() => screen.getByText('Up-regulated'));
    upregulatedButton.click();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByText('logFC')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Insert value').value).toEqual('0.0');
  });
});
