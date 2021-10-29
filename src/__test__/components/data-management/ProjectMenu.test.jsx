import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import '__test__/test-utils/mockWorkerBackend';

import { makeStore } from 'redux/store';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import createTestComponentFactory from '__test__/test-utils/componentFactory';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';

import { loadProjects, setActiveProject } from 'redux/actions/projects';
import ProjectMenu from '../../../components/data-management/ProjectMenu';

const projectMenuFactory = createTestComponentFactory(ProjectMenu);

const defaultAPIResponse = generateDefaultMockAPIResponses(fake.EXPERIMENT_ID);

let storeState = null;

const projectWithoutSampleUuid = '4761594b-mock-test-ba89-c2c812d39bb5';

describe('ProjectMenu', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}));

    fetchMock.mockIf(/.*/, mockAPI(defaultAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadProjects());
    await storeState.dispatch(setActiveProject(projectWithoutSampleUuid));
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
    expect(screen.getByText('Add samples').closest('button')).toBeInTheDocument();

    // Has Download button
    expect(screen.getByText('Download')).toBeInTheDocument();

    // Has Launch analysis button
    expect(screen.getByText('Process project')).toBeInTheDocument();
  });

  it('Clicking Add Samples should bring up the add samples modal', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {projectMenuFactory()}
        </Provider>,
      );
    });

    const addSamplesButton = screen.getByText('Add samples').closest('button');

    await act(async () => {
      userEvent.click(addSamplesButton);
    });

    await waitFor(() => expect(screen.getByText('Upload')).toBeInTheDocument());
  });
});
