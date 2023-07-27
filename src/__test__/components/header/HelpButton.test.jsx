import React from 'react';
import { screen, render } from '@testing-library/react';

import HelpButton from 'components/header/HelpButton';
import userEvent from '@testing-library/user-event';

import { AccountId } from 'utils/deploymentInfo';

import nextConfig from 'next/config';
import config from 'config';

const renderHelpButton = () => render(<HelpButton />);

jest.mock('next/config');

const mockAccountId = (accountId) => {
  nextConfig.mockReturnValue({ publicRuntimeConfig: { accountId } });
};

describe('HelpButton', () => {
  it('Renders the testing buttton properly', () => {
    mockAccountId(AccountId.BIOMAGE);
    renderHelpButton();

    expect(screen.getByText(/Need help?/i)).toBeDefined();
    expect(screen.getByRole('img', { name: 'down' })).toBeDefined();
  });

  it('Biomage - Renders correctly and pop up shows up when clicked', () => {
    mockAccountId(AccountId.BIOMAGE);
    renderHelpButton();

    userEvent.click(screen.getByText(/Need help?/i));
    expect(screen.getByRole('img', { name: 'down' })).toBeDefined();

    expect(screen.getByText(/user guide/i)).toBeDefined();
    expect(screen.getByText(/Ask questions about how to use Cellenics and make feature requests/i)).toBeDefined();
    expect(screen.getByText(/Cellenics community forum/i)).toBeDefined();

    // Links contain the desired targets
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

  it('HMS - Renders correctly and pop up shows up when clicked', () => {
    mockAccountId(AccountId.HMS);
    renderHelpButton();

    userEvent.click(screen.getByText(/Need help?/i));
    expect(screen.getByRole('img', { name: 'down' })).toBeDefined();

    expect(screen.getByText(/For 1-2-1 support with your analysis, contact/));

    // Links contain the desired targets
    const mailToLink = screen.getByText(config.supportEmail).closest('a');
    expect(mailToLink).toHaveAttribute('href', `mailto: ${config.supportEmail}`);
    expect(mailToLink).not.toHaveAttribute('target');
  });
});
