import '@testing-library/jest-dom';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import React from 'react';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import FeedbackButton from 'components/header/FeedbackButton';

jest.mock('', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => true),
  federatedSignIn: jest.fn(),
}));

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

describe('FeedbackButton', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('renders a button correctly without any props', () => {
    render(<FeedbackButton />);
    expect(screen.getByText(/Feedback/i)).toBeDefined();
  });

  it('Shows a text area input with 2 buttons when opened', () => {
    render(<FeedbackButton />);

    const feedbackButton = screen.getByText(/Feedback/i);
    fireEvent.click(feedbackButton);

    // There is a textarea
    expect(screen.getByPlaceholderText(/Feedback/i)).toBeDefined();

    // With 2 buttons
    expect(screen.getByText(/cancel/i)).toBeDefined();
    expect(screen.getByText(/Send/i)).toBeDefined();
  });

  it('It sends a POST request containing the feedback', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(new Response('OK')));

    render(<FeedbackButton />);

    const feedbackText = 'Some feedback';

    const feedbackButton = screen.getByText(/Feedback/i);
    fireEvent.click(feedbackButton);

    const feedbackInput = screen.getByPlaceholderText(/Feedback/i);

    fireEvent.change(feedbackInput, { target: { value: feedbackText } });
    expect(feedbackInput).toHaveValue(feedbackText);

    const submitButton = screen.getByText(/Send/i).closest('button');

    // test cancel by closing and opening again
    const cancelButton = screen.getByText(/Cancel/i).closest('button');
    fireEvent.click(cancelButton);
    fireEvent.click(feedbackButton);
    expect(feedbackInput).toHaveValue(feedbackText);

    fireEvent.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const feedbackBody = fetchMock.mock.calls[0][1].body;
    expect(feedbackBody).toMatch(feedbackText);

    await waitFor(() => expect(pushNotificationMessage).toHaveBeenCalledTimes(1));

    const pushNotificationMessageParams = pushNotificationMessage.mock.calls[0];

    expect(pushNotificationMessageParams[0]).toEqual('success');
    expect(pushNotificationMessageParams[1]).toEqual(endUserMessages.FEEDBACK_SUCCESSFUL);

    expect(feedbackInput).toHaveValue('');
  });

  it('It sends an error message on sending POST request fails', async () => {
    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Some error')));

    render(<FeedbackButton />);

    const feedbackText = 'Some feedback';

    const feedbackButton = screen.getByText(/Feedback/i);
    fireEvent.click(feedbackButton);

    const feedbackInput = screen.getByPlaceholderText(/Feedback/i);

    fireEvent.change(feedbackInput, { target: { value: feedbackText } });
    expect(feedbackInput).toHaveValue(feedbackText);

    const submitButton = screen.getByText(/Send/i).closest('button');

    fireEvent.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(pushNotificationMessage).toHaveBeenCalledTimes(1));
    const pushNotificationMessageParams = pushNotificationMessage.mock.calls[0];
    expect(pushNotificationMessageParams[0]).toEqual('error');
    expect(pushNotificationMessageParams[1]).toEqual(endUserMessages.FEEDBACK_ERROR);

    expect(feedbackInput).toHaveValue(feedbackText);
  });
});
