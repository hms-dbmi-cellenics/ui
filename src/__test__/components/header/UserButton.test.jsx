import React from 'react';

import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import Auth from '@aws-amplify/auth';

import UserButton from 'components/header/UserButton';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import { loadUser } from 'redux/actions/user';

const UserButtonFactory = createTestComponentFactory(UserButton);

const renderUserButton = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {UserButtonFactory(store)}
      </Provider>,
    );
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
  let store;

  beforeEach(async () => {
    jest.clearAllMocks();

    store = makeStore();

    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve({ attributes: { name: userName, 'custom:agreed_terms': 'true' } }));
    Auth.signOut = jest.fn(() => { });
    Auth.federatedSignIn = jest.fn(() => { });

    store.dispatch(loadUser());
  });

  it('Shows sign in by default', async () => {
    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve(null));
    store.dispatch(loadUser());

    await renderUserButton(store);

    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  it('Shows the user initial for the ', async () => {
    const userInitial = getUserInitial();

    await renderUserButton(store);

    expect(screen.getByText(userInitial)).toBeInTheDocument();
  });

  it('Clicking on menu opens up the menu bar', async () => {
    await renderUserButton(store);

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
