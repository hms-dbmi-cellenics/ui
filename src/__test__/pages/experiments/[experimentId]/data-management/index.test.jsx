import React from 'react';
import _ from 'lodash';

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { Provider } from 'react-redux';

import { makeStore } from 'redux/store';

import '__test__/test-utils/mockWorkerBackend';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import mockAPI, { generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import {
  projects,
  samples,
} from '__test__/test-utils/mockData';

import downloadFromUrl from 'utils/data-management/downloadFromUrl';

import DataManagementPage from 'pages/data-management';
import userEvent from '@testing-library/user-event';

import loadEnvironment from 'redux/actions/networkResources/loadEnvironment';
import { setActiveProject } from 'redux/actions/projects';

jest.mock('utils/data-management/downloadFromUrl');
jest.mock('react-resize-detector', () => (props) => props.children({ width: 100, height: 100 }));

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn(() => Promise.resolve({ attributes: { name: 'mockUserName' } })),
  federatedSignIn: jest.fn(),
}));

// Necessary due to storage being used in the default SamplesTable.
jest.mock('@aws-amplify/storage', () => ({
  configure: jest.fn(),
  get: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
  list: jest.fn(() => Promise.resolve([
    { key: 'Example_1.zip' },
    { key: 'Another-Example_2.zip' },
  ])),
}));

const expectedSampleNames = [
  'Example 1',
  'Another-Example 2',
];

const firstProjectWithSamples = projects.find((p) => p.samples.length > 0);
const projectIdWithSamples = firstProjectWithSamples.uuid;
const experimentIdWithSamples = firstProjectWithSamples.experiments[0];

const firstProjectWithoutSamples = projects.find((p) => p.samples.length === 0);
const projectIdWithoutSamples = firstProjectWithoutSamples.uuid;
const experimentIdWithoutSamples = firstProjectWithoutSamples.experiments[0];

const route = 'data-management';
const defaultProps = { route };

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentIdWithSamples, projectIdWithSamples),
  generateDefaultMockAPIResponses(experimentIdWithoutSamples, projectIdWithoutSamples),
);
const dataManagementPageFactory = createTestComponentFactory(DataManagementPage, defaultProps);

let storeState = null;

describe('Data Management page', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();
    storeState.dispatch(loadEnvironment('test'));
  });

  it('Shows an empty project list if there are no projects', async () => {
    const noProjectsResponse = {
      ...mockAPIResponse,
      '/projects': () => promiseResponse(
        JSON.stringify([]),
      ),
    };

    fetchMock.mockIf(/.*/, mockAPI(noProjectsResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    expect(screen.getByText(/Create New Project/i)).toBeInTheDocument();
  });

  it('Clicking "Create New Project" opens create new project modal', async () => {
    await act(() => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    const newProjectButton = screen.getByText(/Create New Project/i).closest('button');

    await act(async () => {
      userEvent.click(newProjectButton);
    });

    expect(screen.getByLabelText(/new project name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/new project description/i)).toBeInTheDocument();

    expect(screen.getByText(/Create project/i)).toBeInTheDocument();
  });

  it('Has Project Details tile', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    // Select the project with samples
    await act(async () => {
      storeState.dispatch(setActiveProject(projectIdWithSamples));
    });

    expect(screen.getAllByText(/Project Details/i).length).toBeGreaterThan(0);

    const addMetadataButton = screen.getByText(/Add Metadata/i).closest('button');

    expect(addMetadataButton).toBeInTheDocument();

    // We do this because the instruction to add samples also contain "Add samples"
    const addSamplesElement = screen.getAllByText(/Add Samples/i);
    const addSampleButton = addSamplesElement.find((el) => el.closest('button'));

    expect(addSampleButton).toBeInTheDocument();
    expect(addSampleButton).not.toBeDisabled();

    const downloadButton = screen.getByText(/Download/i).closest('button');

    expect(downloadButton).toBeInTheDocument();

    const processProjectButton = screen.getByText(/Process project/i).closest('button');

    expect(processProjectButton).toBeInTheDocument();
  });

  it('Example datasets are available for download', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    // There are 2 elements with the name of the project,  because of how Antd renders the element
    // so we're only choosing one
    const projectName = screen.getAllByText(firstProjectWithoutSamples.name)[0];

    await act(async () => {
      userEvent.click(projectName);
    });

    // const exampleInfo = screen.getByText(/Don't have data\? Get started using one of our example datasets/i);

    await waitFor(() => {
      expect(screen.getByText(/Don't have data\? Get started using one of our example datasets/i)).toBeInTheDocument();
    });

    // Example information exists
    // expect(exampleInfo).toBeInTheDocument();

    const downloadPromises = expectedSampleNames.map(async (sampleName) => {
      const fileDownloadLink = screen.getByText(sampleName);

      expect(fileDownloadLink).toBeInTheDocument();

      // Clicking the link will trigger downlaod
      userEvent.click(fileDownloadLink);
    });

    await Promise.all(downloadPromises);

    expect(downloadFromUrl).toHaveBeenCalledTimes(expectedSampleNames.length);
  });

  it('Shows samples table if project contain samples', async () => {
    // Change to project with samples
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    // There are 2 elements with the name of the project,  because of how Antd renders the element
    // so we're only choosing one
    const projectOption = screen.getAllByText(firstProjectWithSamples.name)[0];

    await act(async () => {
      userEvent.click(projectOption);
    });

    Object.keys(samples).forEach((sample) => {
      expect(screen.getByText(samples[sample].name)).toBeInTheDocument();
    });
  });
});
