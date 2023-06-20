import React from 'react';
import { screen, render } from '@testing-library/react';

import HelpButton from 'components/header/HelpButton';
import userEvent from '@testing-library/user-event';

const renderHelpButton = () => render(<HelpButton />);
jest.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    accountId: '242905224710',
  },
}));

describe('HelpButton', () => {
  it('Renders the testing buttton properly', () => {
    renderHelpButton();

    expect(screen.getByText(/Need help?/i)).toBeDefined();
    expect(screen.getByRole('img', { name: 'down' })).toBeDefined();
  });

  it('Pop up shows up when clicked', () => {
    renderHelpButton();

    userEvent.click(screen.getByText(/Need help?/i));

    expect(screen.getByText(/For 1-2-1 support with your analysis/i)).toBeDefined();
  });
});
