import React from 'react';
import {
  screen, render,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import _ from 'lodash';
import '@testing-library/jest-dom';
import '__test__/test-utils/mockWorkerBackend';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';

import fake from '__test__/test-utils/constants';
import { experiments } from '__test__/test-utils/mockData';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

import ProjectMenu from 'components/data-management/project/ProjectMenu';
import { loadExperiments, setActiveExperiment } from 'redux/actions/experiments';

const mockNavigateTo = jest.fn();
jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => ({
    username: 'mockuser',
    attributes: {
      email: 'mock@user.name',
      name: 'Mocked User',
    },
  })),
}));
jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const experimentWithSamplesId = experimentWithSamples.id;
const experimentWithoutSamplesId = experimentWithoutSamples.id;

const defaultAPIResponse = generateDefaultMockAPIResponses(
  experimentWithSamplesId,
);

const responses = _.merge(defaultAPIResponse, {
  [`/v2/access/${fake.EXPERIMENT_ID}-1$`]: () => (
    Promise.resolve(
      new Response(JSON.stringify(
        [{
          name: 'Bob',
          email: 'bob@bob.com',
          role: 'explorer',
        },
        {
          name: 'Mocked User',
          email: 'mock@user.name',
          role: 'owner',
        }],
      )),
    )),
});
let storeState = null;

const projectMenuFactory = createTestComponentFactory(ProjectMenu);

describe('ProjectMenu', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}));

    fetchMock.mockIf(/.*/, mockAPI(responses));

    storeState = makeStore();

    await storeState.dispatch(loadExperiments());
    await storeState.dispatch(setActiveExperiment(experimentWithoutSamplesId));
  });

  it('Renders correctly when there is a project', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {projectMenuFactory()}
        </Provider>,
      );
    });

    // Has add samples button
    expect(screen.getByText('Add data').closest('button')).toBeInTheDocument();

    // Has Download button
    expect(screen.getByText('Download')).toBeInTheDocument();

    // Has Launch analysis button
    expect(screen.getByText('Process project')).toBeInTheDocument();

    // Has share button
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('Clicking Add Data should bring up the add data modal', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {projectMenuFactory()}
        </Provider>,
      );
    });

    const addDataButton = screen.getByText('Add data').closest('button');

    await act(async () => {
      userEvent.click(addDataButton);
    });

    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('Clicking on Share button opens share experiment modal', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {projectMenuFactory()}
        </Provider>,
      );
    });

    const shareButton = screen.getByText('Share').closest('button');

    await act(async () => {
      userEvent.click(shareButton);
    });

    expect(screen.getByText('Share with collaborators')).toBeInTheDocument();

    // closing works
    const closeButton = screen.getByLabelText('Close').closest('button');
    await act(async () => {
      userEvent.click(closeButton);
    });
    expect(screen.queryByText('Share with collaborators')).not.toBeInTheDocument();
  });
});
