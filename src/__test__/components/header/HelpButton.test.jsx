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

    expect(screen.getByText(/user guide/i)).toBeDefined();
    expect(screen.getByText(/Ask questions about how to use Cellenics and make feature requests/i)).toBeDefined();
    expect(screen.getByText(/our website/i)).toBeDefined();
    expect(screen.getByText(/Cellenics community forum/i)).toBeDefined();
  });

  it('Links contain the desired targets', () => {
    renderHelpButton();

    userEvent.click(screen.getByText(/Need help?/i));

    const guideLink = screen.getByText(/user guide/i).closest('a');
    expect(guideLink).toHaveAttribute('href', 'https://www.biomage.net/user-guide');
    expect(guideLink).toHaveAttribute('target', '_blank');

    const websiteLink = screen.getByText(/tutorial videos/i).closest('a');
    expect(websiteLink).toHaveAttribute('href', 'https://www.youtube.com/@biomageltd4616/featured');
    expect(websiteLink).toHaveAttribute('target', '_blank');

    const forumLink = screen.getByText(/Cellenics community forum/i).closest('a');
    expect(forumLink).toHaveAttribute('href', 'https://community.biomage.net/');
    expect(forumLink).toHaveAttribute('target', '_blank');
  });
});
