import React from 'react';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import { makeStore } from 'redux/store';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import Auth from '@aws-amplify/auth';
import ProfileSettings from 'pages/settings/profile';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { Provider } from 'react-redux';

import { loadUser } from 'redux/actions/user';
import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
  __esModule: true,
}));
jest.mock('@aws-amplify/auth', () => jest.fn());
jest.mock('utils/pushNotificationMessage');

const updateMock = jest.fn(() => Promise.resolve(true));

const profileSettingsPageFactory = createTestComponentFactory(ProfileSettings);

const renderProfileSettingsPage = (store, newState = {}) => {
  render(
    <Provider store={store}>
      {profileSettingsPageFactory(newState)}
    </Provider>,
  );
};

const setUpAuthMocks = () => {
  Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve({
    attributes: {
      name: userName,
      'custom:agreed_terms': 'true',
    },
  }));
  Auth.signOut = jest.fn(() => { });
  Auth.federatedSignIn = jest.fn(() => { });
  Auth.updateUserAttributes = updateMock;
};

const userName = 'Arthur Dent';
jest.mock('components/Header', () => () => <></>);

describe('Profile page', () => {
  const store = makeStore();

  beforeEach(async () => {
    jest.clearAllMocks();

    setUpAuthMocks();

    store.dispatch(loadDeploymentInfo({ environment: 'test' }));
    store.dispatch(loadUser());
  });

  it('check that the back button is called on cancel', async () => {
    const backMock = jest.fn();
    useRouter.mockImplementation(() => ({
      back: backMock,
    }));

    await act(async () => {
      renderProfileSettingsPage(store);
    });

    await act(async () => {
      userEvent.click(screen.getByText('Cancel'));
    });

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it('check update is called on Save changes', async () => {
    await act(async () => {
      renderProfileSettingsPage(store);
    });

    const nameInput = screen.getByPlaceholderText(userName);
    await act(async () => {
      userEvent.type(nameInput, 'JX Name Man');
    });
    await act(async () => {
      userEvent.click(screen.getByText('Save changes'));
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
  });
});
