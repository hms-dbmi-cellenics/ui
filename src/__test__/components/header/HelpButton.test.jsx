import React from 'react';
import { screen, render } from '@testing-library/react';

import HelpButton from 'components/header/HelpButton';
import userEvent from '@testing-library/user-event';

const renderHelpButton = () => render(<HelpButton />);

describe('HelpButton', () => {
  it('Renders the testing buttton properly', () => {
    renderHelpButton();

    expect(screen.getByText(/Help & resources/i)).toBeDefined();
    expect(screen.getByRole('img', { name: 'down' })).toBeDefined();
  });

  it('Pop up shows up when clicked', () => {
    renderHelpButton();

    userEvent.click(screen.getByText(/Help & resources/i));

    expect(screen.getByText(/how to use Cellenics, visit/i)).toBeDefined();
    expect(screen.getByText(/our website/i)).toBeDefined();
    expect(screen.getByText(/help with your analysis, email:/i)).toBeDefined();
    expect(screen.getByText(/hello@biomage.net/i)).toBeDefined();
  });

  it('Links contain the desired targets', () => {
    renderHelpButton();

    userEvent.click(screen.getByText(/Help & resources/i));

    const websiteLink = screen.getByText(/our website/i).closest('a');
    expect(websiteLink).toHaveAttribute('href', 'https://www.biomage.net/get-started');
    expect(websiteLink).toHaveAttribute('target', '_blank');

    const mailtoLink = screen.getByText(/hello@biomage.net/i).closest('a');
    expect(mailtoLink).toHaveAttribute('href', 'mailto:hello@biomage.net');
  });
});
