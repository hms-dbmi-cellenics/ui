import React from 'react';
import _ from 'lodash';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { Provider } from 'react-redux';

import { makeStore } from 'redux/store';

import '__test__/test-utils/mockWorkerBackend';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import mockAPI, { generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import {
  experiments,
  samples,
} from '__test__/test-utils/mockData';

import downloadFromUrl from 'utils/data-management/downloadFromUrl';

import DataManagementPage from 'pages/data-management';
import { exampleDatasets } from 'components/data-management/SamplesTable';
import userEvent from '@testing-library/user-event';
import { setActiveProject } from 'redux/actions/projects';

jest.mock('utils/data-management/downloadFromUrl');
jest.mock('react-resize-detector', () => (props) => props.children({ width: 100, height: 100 }));

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

// Necessary due to storage being used in the default SamplesTable.
jest.mock('@aws-amplify/storage', () => ({
  get: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
}));

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const experimentWithSamplesId = experimentWithSamples.id;
const experimentWithoutSamplesId = experimentWithoutSamples.id;

const route = 'data-management';
const defaultProps = { route };

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentWithSamplesId),
  generateDefaultMockAPIResponses(experimentWithoutSamplesId),
);
const dataManagementPageFactory = createTestComponentFactory(DataManagementPage, defaultProps);

let storeState = null;

describe('Data Management page', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();
  });

  it('Shows an empty project list if there are no projects', async () => {
    const noProjectsResponse = {
      ...mockAPIResponse,
      '/experiments': () => promiseResponse(
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
      storeState.dispatch(setActiveProject(experimentWithSamplesId));
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
    const projectName = screen.getAllByText(experimentWithoutSamples.name)[0];

    await act(async () => {
      userEvent.click(projectName);
    });

    const exampleInfo = screen.getByText(/Don't have data\? Get started using one of our example datasets/i);

    // Example information exists
    expect(exampleInfo).toBeInTheDocument();

    const downloadPromises = exampleDatasets.map(async ({ description }) => {
      const fileDownloadLink = screen.getByText(description);

      expect(fileDownloadLink).toBeInTheDocument();

      // Clicking the link will trigger downlaod
      userEvent.click(fileDownloadLink);
    });

    await Promise.all(downloadPromises);

    expect(downloadFromUrl).toHaveBeenCalledTimes(exampleDatasets.length);
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
    const projectOption = screen.getAllByText(experimentWithSamples.name)[0];

    await act(async () => {
      userEvent.click(projectOption);
    });

    Object.keys(samples).forEach((sample) => {
      expect(screen.getByText(samples[sample].name)).toBeInTheDocument();
    });
  });
});
