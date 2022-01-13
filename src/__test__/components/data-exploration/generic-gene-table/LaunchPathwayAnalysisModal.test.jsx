import React from 'react';
import userEvent from '@testing-library/user-event';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';
import {
  render, screen, waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

const onCancel = jest.fn();

const renderPathwayAnalysisModal = () => {
  render(
    <Provider store={makeStore()}>
      <LaunchPathwayAnalysisModal onCancel={onCancel} />
    </Provider>,
  );
};

describe('Pathway analysis modal ', () => {
  const pathwayServices = ['pantherdb', 'enrichr'];

  it('Renders properly', () => {
    renderPathwayAnalysisModal();
    expect(screen.getByText('You have not performed any filtering on the genes!')).toBeInTheDocument();
    pathwayServices.forEach((service) => {
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
});
