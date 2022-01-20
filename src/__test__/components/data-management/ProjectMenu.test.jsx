import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import '__test__/test-utils/mockWorkerBackend';

import { makeStore } from 'redux/store';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

import { loadProjects, setActiveProject } from 'redux/actions/projects';
import { projects } from '__test__/test-utils/mockData';
import ProjectMenu from '../../../components/data-management/ProjectMenu';

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

const projectWithSamples = projects.find((project) => project.samples.length > 0);
const projectWithoutSamples = projects.find((project) => project.samples.length === 0);

const experimentWithSamplesId = projectWithSamples.experiments[0];
const projectWithSamplesId = projectWithSamples.uuid;

const defaultAPIResponse = generateDefaultMockAPIResponses(
  experimentWithSamplesId,
  projectWithSamplesId,
);

let storeState = null;

const projectMenuFactory = createTestComponentFactory(ProjectMenu);

describe('ProjectMenu', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}));

    fetchMock.mockIf(/.*/, mockAPI(defaultAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadProjects());
    await storeState.dispatch(setActiveProject(projectWithoutSamples.uuid));
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
