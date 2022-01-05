import React from 'react';
import { Provider } from 'react-redux';
import PathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/PathwayAnalysisModal';
import {
  render, screen, fireEvent, waitFor,
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
  });

  it('Clicking enrichr radio button removes suggestion text', async () => {
    renderPathwayAnalysisModal();
    const enrichrRadioButton = screen.getByLabelText('enrichr');
    fireEvent.click(enrichrRadioButton);
    // await waitFor(() => expect(screen.queryByText('You have not performed any filtering on the genes!')).not.toBeInTheDocument());
  });

  // todo test if the warning message appears when there was filtering perform
});
