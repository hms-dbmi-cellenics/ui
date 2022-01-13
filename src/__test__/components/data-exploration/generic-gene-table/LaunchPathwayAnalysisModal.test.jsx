import React from 'react';
import userEvent from '@testing-library/user-event';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';
import { makeStore } from 'redux/store';

import {
  render, screen, waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';

describe('Pathway analysis modal ', () => {
  const onCancel = jest.fn();
  const renderPathwayAnalysisModal = (filtersApplied = false) => {
    render(
      <Provider store={makeStore()}>
        <LaunchPathwayAnalysisModal
          onCancel={onCancel}
          advancedFiltersAdded={filtersApplied}
        />
      </Provider>,
    );
  };

  const externalServices = ['pantherdb', 'enrichr'];

  it('Renders properly', () => {
    renderPathwayAnalysisModal();
    expect(screen.getByText('You have not performed any filtering on the genes!')).toBeInTheDocument();
    externalServices.forEach((service) => {
      expect(screen.getByLabelText(service)).toBeInTheDocument();
    });

    expect(screen.getByLabelText('pantherdb').checked).toEqual(true);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    const closeButton = screen.getAllByLabelText('close')[0];
    closeButton.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('Clicking enrichr radio button removes suggestion text', async () => {
    renderPathwayAnalysisModal();
    const enrichrRadioButton = screen.getByLabelText('enrichr');
    userEvent.click(enrichrRadioButton);
    await waitFor(() => (
      expect(screen.queryByText('It is strongly recommended to input', { exact: false })).not.toBeInTheDocument()));
  });

  it('Opens advanced filters modal if there are no filters', async () => {
    renderPathwayAnalysisModal();
    const advancedFilteringButton = screen.getByText('advanced filtering', { exact: false });
    advancedFilteringButton.click();
    await waitFor(() => expect(screen.getByText('Advanced filters')).toBeInTheDocument());
  });

  it('Apply filters warning message is not there if there are filters', async () => {
    renderPathwayAnalysisModal(true);
    expect(screen.queryByText('You have not performed any filtering on the genes!', { exact: false })).not.toBeInTheDocument();
  });
});
