import React from 'react';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import Auth from '@aws-amplify/auth';
import ProfileSettings from 'pages/settings/profile';
import pushNotificationMessage from 'utils/pushNotificationMessage';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
  __esModule: true,
}));
jest.mock('@aws-amplify/auth', () => jest.fn());
jest.mock('utils/pushNotificationMessage');

const profileSettingsPageFactory = createTestComponentFactory(ProfileSettings);
const updateMock = jest.fn(() => Promise.resolve(true));

const userName = 'Arthur Dent';
jest.mock('components/Header', () => () => <></>);

describe('Profile page', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve({ attributes: { name: userName } }));
    Auth.signOut = jest.fn(() => { });
    Auth.federatedSignIn = jest.fn(() => { });
    Auth.updateUserAttributes = updateMock;
  });

  it('check that the back button is called on cancel', async () => {
    const backMock = jest.fn();
    useRouter.mockImplementation(() => ({
      back: backMock,
    }));

    await act(async () => {
      render(
        profileSettingsPageFactory(),
      );
    });

    await act(async () => {
      userEvent.click(screen.getByText('Cancel'));
    });

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it('check update is called on Save changes', async () => {
    await act(async () => {
      render(
        profileSettingsPageFactory(),
      );
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
