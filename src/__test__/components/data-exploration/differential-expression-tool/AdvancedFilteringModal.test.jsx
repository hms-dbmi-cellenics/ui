import React from 'react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initialState from 'redux/reducers/differentialExpression/initialState';

import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';

const mockStore = configureMockStore([thunk]);

const renderAdvancedFilteringModal = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        <AdvancedFilteringModal
          onCancel={onCancel}
          onLaunch={onLaunch}
        />
      </Provider>,
    );
  });
};

let storeState = null;

const onCancel = jest.fn();
const onLaunch = jest.fn();

describe('Advanced filtering modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    storeState = makeStore();
  });

  it('Renders properly', async () => {
    await renderAdvancedFilteringModal(storeState);
    expect(screen.getByText('Add custom filter')).toBeInTheDocument();
    expect(screen.getByText('Apply filters')).toBeInTheDocument();
    expect(screen.getByText('Add preset filter')).toBeInTheDocument();
    const closeButton = screen.getAllByLabelText('close')[0];
    closeButton.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('Add filter button adds new form items', async () => {
    await renderAdvancedFilteringModal(storeState);
    const addFilterButton = screen.getByText('Add custom filter');

    userEvent.click(addFilterButton);

    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByPlaceholderText('Insert value')).toBeInTheDocument();

    userEvent.click(addFilterButton);

    expect(screen.getAllByRole('combobox').length).toEqual(4);
    expect(screen.getAllByPlaceholderText('Insert value').length).toEqual(2);
  });

  it('Close button removes items from the list', async () => {
    await renderAdvancedFilteringModal(storeState);

    // adding 2 custom filters
    const addFilterButton = screen.getByText('Add custom filter');
    userEvent.click(addFilterButton);
    userEvent.click(addFilterButton);

    // checking the number of entries in the row
    expect(screen.getAllByRole('combobox').length).toEqual(4);
    const closeButton = screen.getAllByLabelText('close')[1];

    // clicking close should remove entry
    userEvent.click(closeButton);
    expect(screen.getAllByRole('combobox').length).toEqual(2);
  });

  it('Preset filters button adds a preset filter', async () => {
    await renderAdvancedFilteringModal(storeState);

    const presetFiltersButton = screen.getByText('Add preset filter');
    userEvent.hover(presetFiltersButton);

    const upregulatedButton = await waitFor(() => screen.getByText('Up-regulated'));
    userEvent.click(upregulatedButton);

    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByText('logFC')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Insert value').value).toEqual('0.0');
  });

  it('Clicking apply filters triggers onLaunch', async () => {
    await renderAdvancedFilteringModal(storeState);

    // adding a filter
    const presetFiltersButton = screen.getByText('Add preset filter');
    userEvent.hover(presetFiltersButton);

    const upregulatedButton = await waitFor(() => screen.getByText('Up-regulated'));

    userEvent.click(upregulatedButton);

    await waitFor(() => screen.getByText('logFC'));

    // applying filters and checking if onLaunch was called
    const applyButton = screen.getByText('Apply filters');

    userEvent.click(applyButton);

    await waitFor(() => expect(onLaunch).toHaveBeenCalled());
  });

  it('Should show all preset and filer options by default', async () => {
    await renderAdvancedFilteringModal(storeState);

    // adding a filter
    const presetFiltersButton = screen.getByText('Add preset filter');
    userEvent.hover(presetFiltersButton);

    await waitFor(() => {
      expect(screen.getByText('Up-regulated')).toBeInTheDocument();
      expect(screen.getByText('Down-regulated')).toBeInTheDocument();
      expect(screen.queryByText('Significant')).toBeInTheDocument();
    });

    // Add a filter
    const addFilterButton = screen.getByText('Add custom filter');
    userEvent.click(addFilterButton);

    // Open the combobox
    const propertyDropdown = screen.getAllByRole('combobox')[0];
    userEvent.click(propertyDropdown);
    userEvent.click(screen.getAllByText('logFC')[1]);

    // Get all available options
    const listOptionContainer = screen.getByText('AUC').closest('div[class=rc-virtual-list]');
    const options = listOptionContainer.querySelectorAll('div[class=ant-select-item-option-content]');

    const expectedFilterOptions = ['logFC', 'adj p-value', 'Pct1', 'Pct2', 'AUC'];

    expect(options.length).toEqual(expectedFilterOptions.length);
    options.forEach((el) => {
      expect(expectedFilterOptions).toContain(el.textContent);
    });
  });

  it('Filters are shown according to the available columns in DE table', async () => {
    // This option appears if there is not more than 2 samples in a between comparison
    const limitedOptionState = {
      differentialExpression: {
        ...initialState,
        properties: {
          ...initialState.properties,
          data: [
            {
              logFC: '0.0',
            },
          ],
        },
      },
    };

    const limitedOptionStore = mockStore(limitedOptionState);

    await renderAdvancedFilteringModal(limitedOptionStore);

    // adding a filter
    const presetFiltersButton = screen.getByText('Add preset filter');
    userEvent.hover(presetFiltersButton);

    // The "Significant" preset option should not be there because it needs p_val_adj
    await waitFor(() => {
      expect(screen.getByText('Up-regulated')).toBeInTheDocument();
      expect(screen.getByText('Down-regulated')).toBeInTheDocument();
      expect(screen.queryByText('Significant')).toBeNull();
    });

    // Add a filter
    const addFilterButton = screen.getByText('Add custom filter');
    userEvent.click(addFilterButton);

    // Open the combobox
    const propertyDropdown = screen.getAllByRole('combobox')[0];
    userEvent.click(propertyDropdown);

    const logFcOption = screen.getAllByText('logFC')[1];
    userEvent.click(logFcOption);

    // Get all available options
    const listOptionContainer = logFcOption.closest('div[class=rc-virtual-list]');
    const options = listOptionContainer.querySelectorAll('div[class=ant-select-item-option-content]');

    const expectedFilterOptions = ['logFC'];

    // Only logFC should be available
    expect(options.length).toEqual(expectedFilterOptions.length);
    options.forEach((el) => {
      expect(expectedFilterOptions).toContain(el.textContent);
    });
  });
});
