import React from 'react';
import {
  screen, render, fireEvent, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import fake from '__test__/test-utils/constants';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, {
} from '__test__/test-utils/mockAPI';

import ShareExperimentModal from 'components/data-management/ShareExperimentModal';

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => ({
    username: 'mockuser',
    attributes: {
      email: 'mock@user.name',
      name: 'Mocked User',
    },
  })),
}));

describe('Share expeirment modal', () => {
  const onCancel = jest.fn();
  enableFetchMocks();

  const customAPIResponse = {
    [`/access/${fake.EXPERIMENT_ID}`]: () => Promise.resolve(new Response(JSON.stringify([{
      name: 'Bob',
      email: 'bob@bob.com',
      role: 'explorer',
    },
    {
      name: 'Mocked User',
      email: 'mock@user.name',
      role: 'owner',
    }]))),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(customAPIResponse));
  });

  const renderShareExperimentModal = async () => {
    await act(async () => render(
      <ShareExperimentModal
        onCancel={onCancel}
        activeProject={{
          experiments: [fake.EXPERIMENT_ID],
          uuid: fake.PROJECT_ID,
          name: fake.PROJECT_NAME,
        }}
      />,
    ));
  };

  it('Renders correctly', async () => {
    await renderShareExperimentModal();
    expect(screen.getByText('Share with collaborators')).toBeInTheDocument();
    expect(screen.getByText(fake.PROJECT_NAME)).toBeInTheDocument();
    expect(screen.getByText('Input an email address.Add multiple addresses with enter.')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox').length).toEqual(2);
    expect(screen.getByText('bob@bob.com')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' });
    expect(revokeButtons.length).toEqual(2);

    // revoke button for the user viewing is disabled
    expect(revokeButtons[1]).toHaveAttribute('disabled');
  });

  it('Inviting users works', async () => {
    await renderShareExperimentModal();
    const input = screen.getAllByRole('combobox');
    userEvent.type(input[0], 'asd@asd.com{enter}');

    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());
    const inviteButton = screen.getByText('Add');
    await act(() => fireEvent.click(inviteButton));
    expect(fetchMock.mock.calls.length).toEqual(2);
    expect(fetchMock.mock.calls[1]).toMatchSnapshot();
  });

  it('Revoke access', async () => {
    await renderShareExperimentModal();
    const revokeButton = screen.getAllByText('Revoke');
    expect(screen.getByText('bob@bob.com')).toBeInTheDocument();
    await act(() => userEvent.click(revokeButton[0]));
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});
