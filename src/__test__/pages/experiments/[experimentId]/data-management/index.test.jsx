import React from 'react';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { Provider } from 'react-redux';

import { makeStore } from 'redux/store';

import '__test__/test-utils/mockWorkerBackend';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';

import downloadFromUrl from 'utils/data-management/downloadFromUrl';

import DataManagementPage from 'pages/data-management';
import { exampleDatasets } from 'components/data-management/SamplesTable';
import userEvent from '@testing-library/user-event';

jest.mock('utils/data-management/downloadFromUrl');
jest.mock('react-resize-detector', () => (props) => props.children({ width: 100, height: 100 }));

const experimentId = fake.EXPERIMENT_ID;

const route = 'data-management';
const defaultProps = { route };

const mockAPIResponse = generateDefaultMockAPIResponses(experimentId);
const dataManagementPageFactory = createTestComponentFactory(DataManagementPage, defaultProps);

let storeState = null;

describe('Data Management page', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();
  });

  it('Shows an empty project list', async () => {
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

    expect(screen.getAllByText(/Project Details/i).length).toBeGreaterThan(0);

    const addMetadataButton = screen.getByText(/Add Metadata/i).closest('button');

    expect(addMetadataButton).toBeInTheDocument();
    expect(addMetadataButton).toBeDisabled();

    // We do this because the instruction to add samples also contain "Add samples"
    const addSamplesElement = screen.getAllByText(/Add Samples/i);
    const addSampleButton = addSamplesElement.find((el) => el.closest('button'));

    expect(addSampleButton).toBeInTheDocument();
    expect(addSampleButton).not.toBeDisabled();

    const downloadButton = screen.getByText(/Download/i).closest('button');

    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toBeDisabled();

    const processProjectButton = screen.getByText(/Process project/i).closest('button');

    expect(processProjectButton).toBeInTheDocument();
    expect(processProjectButton).toBeDisabled();
  });

  it('Example datasets are available for download', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
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

    const projectWithSamples = screen.getByText(/Project with samples/i);

    await act(async () => {
      userEvent.click(projectWithSamples);
    });

    // These are the projects contained in the mock response project_samples.json
    expect(screen.getByText('WT1')).toBeInTheDocument();
    expect(screen.getByText('WT2')).toBeInTheDocument();
    expect(screen.getByText('KO')).toBeInTheDocument();
  });
});
