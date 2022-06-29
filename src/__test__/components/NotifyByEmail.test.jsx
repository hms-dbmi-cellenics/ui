import React from 'react';
import {
  render, screen,
} from '@testing-library/react';
import NotifyByEmail from 'components/NotifyByEmail';
import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import * as updateExperiment from 'redux/actions/experiments/updateExperiment';
import * as loadExperiments from 'redux/actions/experiments/loadExperiments';
import * as loadExperiment from 'redux/actions/experiments/loadExperiment';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import { makeStore } from 'redux/store';
import fake from '__test__/test-utils/constants';

let storeState = null;

const experimentId = fake.EXPERIMENT_ID;

describe('Notify by email component', () => {
  let updateExperimentSpy;
  let loadExperimentsSpy;
  let loadExperimentSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    updateExperimentSpy = jest.spyOn(updateExperiment, 'default');
    loadExperimentsSpy = jest.spyOn(loadExperiments, 'default');
    loadExperimentSpy = jest.spyOn(loadExperiment, 'default');
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
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
  it('loads experiments if  there is an activeProjectUuid', async () => {
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));
    await renderNotifyByEmail();
    expect(loadExperimentSpy).toHaveBeenCalledTimes(1);
  });

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
    expect(updateExperimentSpy).toHaveBeenLastCalledWith(experimentId, { notifyByEmail: true });
    userEvent.click(toggle);
    expect(updateExperimentSpy).toHaveBeenCalledTimes(2);
  });

  it('loads projects if non-existent', async () => {
    await renderNotifyByEmail();
    expect(loadExperimentsSpy).toHaveBeenCalledTimes(1);
  });
});
