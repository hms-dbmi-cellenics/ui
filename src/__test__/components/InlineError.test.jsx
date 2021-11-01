import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { act } from 'react-dom/test-utils';

import InlineError from 'components/InlineError';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const mockOnClick = jest.fn();

const defaultProps = {
  onClick: mockOnClick,
  actionable: false,
};

const inlineErrorFactory = createTestComponentFactory(InlineError, defaultProps);

const message = 'This is an error message';

describe('MarkerGeneSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should show the error message only when passed only message', async () => {
    await act(async () => {
      render(
        inlineErrorFactory({ message }),
      );
    });

    // Expect screen to show the custom gene selection input by default
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('Should show a button when passed as actionable', async () => {
    await act(async () => {
      render(
        inlineErrorFactory({ message, actionable: true }),
      );
    });

    expect(screen.getByText(message)).toBeInTheDocument();

    // Expect screen to show the button
    const button = screen.getByText(/Retry/i);
    expect(button).toBeInTheDocument();

    userEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
