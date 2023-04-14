import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NotifyByEmail from 'components/NotifyByEmail';
import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import updateExperiment from 'redux/actions/experiments/updateExperiment';
import loadExperiments from 'redux/actions/experiments/loadExperiments';

import { makeStore } from 'redux/store';
import fake from '__test__/test-utils/constants';

let storeState = null;

const experimentId = fake.EXPERIMENT_ID;

jest.mock('redux/actions/experiments/updateExperiment', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));
jest.mock('redux/actions/experiments/loadExperiments', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));

describe('Notify by email component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeState = makeStore();
  });

  const renderNotifyByEmail = async () => {
    await act(async () => (render(
      <Provider store={storeState}>
        <NotifyByEmail
          experimentId={experimentId}
        />
      </Provider>,
    )));
  };

  it('Renders Correctly', async () => {
    await renderNotifyByEmail();
    expect(screen.getByText('Get notified about your pipeline status via email')).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('Saves experiment config on toggle on/off', async () => {
    await renderNotifyByEmail();
    const toggle = screen.getByRole('switch');
    userEvent.click(toggle);
    expect(updateExperiment).toHaveBeenLastCalledWith(experimentId, { notifyByEmail: true });

    userEvent.click(toggle);
    expect(updateExperiment).toHaveBeenCalledTimes(2);
  });

  it('loads experiments if non-existent', async () => {
    await renderNotifyByEmail();
    expect(loadExperiments).toHaveBeenCalledTimes(1);
  });
});
