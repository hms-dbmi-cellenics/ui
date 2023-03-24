import React from 'react';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import '@aws-amplify/auth';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import ReferralButton from 'components/header/ReferralButton';

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => ({
    username: 'mockuser',
    attributes: {
      email: 'mock@user.name',
      name: 'Mocked User',
    },
  })),
}));

enableFetchMocks();

describe('ReferralButton', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('renders a button correctly without any props', () => {
    render(<ReferralButton />);
    expect(screen.getByText(/Invite a friend/i)).toBeDefined();
  });

  it('Shows an input, a text area input and 2 buttons when opened', () => {
    render(<ReferralButton />);

    const referralButton = screen.getByText(/Invite a friend/i);
    userEvent.click(referralButton);

    // There is an email input
    expect(screen.getByPlaceholderText(/Your friend's email address/i)).toBeDefined();

    // There is a textarea to input the value
    expect(screen.getByText(/Hi,/i)).toBeDefined();

    // With 2 buttons
    expect(screen.getByText(/cancel/i)).toBeDefined();
    expect(screen.getByText(/Send invite/i)).toBeDefined();
  });

  it('Submit button is disaibled if email is invalid', async () => {
    render(<ReferralButton />);

    const invalidEmail = 'invalidEmail';

    const referralButton = screen.getByText(/Invite a friend/i);
    userEvent.click(referralButton);

    const emailInput = screen.getByPlaceholderText(/Your friend's email address/i);
    fireEvent.change(emailInput, { target: { value: invalidEmail } });

    await waitFor(() => expect(emailInput).toHaveValue(invalidEmail));

    const submitButton = screen.getByText(/Send invite/i).closest('button');

    expect(submitButton).toBeDisabled();
  });

  it('It sends a POST request containing the feedback', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(new Response('OK')));

    render(<ReferralButton />);

    const emailText = 'friend@email.com';
    const messageText = 'Some message text';

    const referralButton = screen.getByText(/Invite a friend/i);
    userEvent.click(referralButton);

    const emailInput = screen.getByPlaceholderText(/Your friend's email address/i);
    fireEvent.change(emailInput, { target: { value: emailText } });

    await waitFor(() => expect(emailInput).toHaveValue(emailText));

    const customMessageInput = screen.getByText(/Hi,/i);

    fireEvent.change(customMessageInput, { target: { value: messageText } });

    await waitFor(() => expect(customMessageInput).toHaveValue(messageText));

    const submitButton = screen.getByText(/Send invite/i).closest('button');

    fireEvent.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const feedbackBody = fetchMock.mock.calls[0][1].body;
    expect(feedbackBody).toMatch(emailText);
    expect(feedbackBody).toMatch(messageText);

    await waitFor(() => expect(pushNotificationMessage).toHaveBeenCalledTimes(1));
    const pushNotificationMessageParams = pushNotificationMessage.mock.calls[0];

    expect(pushNotificationMessageParams[0]).toEqual('success');
    expect(pushNotificationMessageParams[1]).toEqual(endUserMessages.REFERRAL_SUCCESSFUL);
  });

  it('It sends an error message on sending POST request fails', async () => {
    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Some error')));

    render(<ReferralButton />);

    const emailText = 'friend@email.com';
    const messageText = 'Some message text';

    const referralButton = screen.getByText(/Invite a friend/i);
    userEvent.click(referralButton);

    const emailInput = screen.getByPlaceholderText(/Your friend's email address/i);
    fireEvent.change(emailInput, { target: { value: emailText } });

    await waitFor(() => expect(emailInput).toHaveValue(emailText));

    const customMessageInput = screen.getByText(/Hi,/i);

    fireEvent.change(customMessageInput, { target: { value: messageText } });

    await waitFor(() => expect(customMessageInput).toHaveValue(messageText));

    const submitButton = screen.getByText(/Send invite/i).closest('button');

    fireEvent.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(pushNotificationMessage).toHaveBeenCalledTimes(1));
    const pushNotificationMessageParams = pushNotificationMessage.mock.calls[0];
    expect(pushNotificationMessageParams[0]).toEqual('error');
    expect(pushNotificationMessageParams[1]).toEqual(endUserMessages.REFERRAL_ERROR);
  });
});
