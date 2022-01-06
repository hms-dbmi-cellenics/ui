import React from 'react';
import userEvent from '@testing-library/user-event';
import PathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/PathwayAnalysisModal';
import {
  render, screen, waitFor,
} from '@testing-library/react';

describe('Pathway analysis modal ', () => {
  const onCancel = jest.fn();
  const renderPathwayAnalysisModal = () => {
    render(<PathwayAnalysisModal onCancel={onCancel} />);
  };

  it('Renders properly', () => {
    renderPathwayAnalysisModal();
    expect(screen.getByText('You have not performed any filtering on the genes!')).toBeInTheDocument();
    expect(screen.getByLabelText('pantherdb')).toBeInTheDocument();
    expect(screen.getByLabelText('pantherdb').checked).toEqual(true);
    expect(screen.getByLabelText('enrichr')).toBeInTheDocument();
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

  // todo test if the warning message appears when there was filtering performed
});
