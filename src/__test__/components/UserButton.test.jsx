import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import Auth from '@aws-amplify/auth';

import UserButton from 'components/UserButton';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const UserButtonFactory = createTestComponentFactory(UserButton);

const renderUserButton = async () => {
  await act(async () => {
    render(UserButtonFactory({}));
  });
};

jest.mock('@aws-amplify/auth', () => jest.fn());

const userName = 'Mock user';

const getUserInitial = () => userName.charAt(0).toUpperCase();
const getLoginButton = () => {
  const nameInitial = getUserInitial();
  return screen.getByText(nameInitial).closest('button');
};

describe('UserButton', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve({ attributes: { name: userName } }));
    Auth.signOut = jest.fn(() => { });
    Auth.federatedSignIn = jest.fn(() => { });
  });

  it('Shows sign in by default', async () => {
    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve(null));

    await renderUserButton();

    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  it('Shows the user initial for the ', async () => {
    const userInitial = getUserInitial();

    await renderUserButton();

    expect(screen.getByText(userInitial)).toBeInTheDocument();
  });

  it('Clicking on menu opens up the menu bar', async () => {
    await renderUserButton();

    const button = getLoginButton();

    await act(async () => {
      userEvent.click(button);
    });

    expect(screen.getByText(`Signed in as ${userName}`)).toBeInTheDocument();
    expect(screen.getByText(/Your profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign out/i)).toBeInTheDocument();
  });
});
