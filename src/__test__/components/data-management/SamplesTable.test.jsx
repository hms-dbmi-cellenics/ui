import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import _ from 'lodash';
import { Provider } from 'react-redux';

import mockAPI, { generateDefaultMockAPIResponses, statusResponse } from '__test__/test-utils/mockAPI';
import { projects, samples } from '__test__/test-utils/mockData';

import SamplesTable, { exampleDatasets } from 'components/data-management/SamplesTable';
import { makeStore } from 'redux/store';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import { loadProjects, setActiveProject } from 'redux/actions/projects';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import { loadExperiments } from 'redux/actions/experiments';

jest.mock('@aws-amplify/storage', () => ({
  get: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
}));

jest.mock('utils/data-management/downloadFromUrl');

const defaultProps = {
  height: 100,
};

const samplesTableFactory = createTestComponentFactory(SamplesTable, defaultProps);

enableFetchMocks();

const firstProjectWithSamples = projects.find((p) => p.samples.length > 0);
const projectIdWithSamples = firstProjectWithSamples.uuid;
const experimentIdWithSamples = firstProjectWithSamples.experiments[0];

const firstProjectWithoutSamples = projects.find((p) => p.samples.length === 0);
const projectIdWithoutSamples = firstProjectWithoutSamples.uuid;
const experimentIdWithoutSamples = firstProjectWithoutSamples.experiments[0];

// Mocking samples update / delete routes
const customResponses = {
  [`/projects/${projectIdWithSamples}`]: () => statusResponse(200, JSON.stringify('OK')),
  [`/projects/${projectIdWithSamples}/${experimentIdWithSamples}/samples`]: () => statusResponse(200, 'OK'),
};

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentIdWithSamples, projectIdWithSamples),
  generateDefaultMockAPIResponses(experimentIdWithoutSamples, projectIdWithoutSamples),
  customResponses,
);

let storeState = null;

describe('Samples table', () => {
  beforeEach(async () => {
    fetchMock.mockClear();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadProjects());

    // Loading experiment is usually called in Data Management, so we have to load them manually
    await storeState.dispatch(loadExperiments(projectIdWithSamples));
    await storeState.dispatch(loadExperiments(projectIdWithoutSamples));

    // Defaults to project with samples
    await storeState.dispatch(setActiveProject(projectIdWithSamples));
  });

  it('Shows option to download datasets if there are no samples', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {samplesTableFactory()}
        </Provider>,
      );
    });

    // Load project without samples
    storeState.dispatch(setActiveProject(projectIdWithoutSamples));

    expect(screen.getByText(/Start uploading your samples by clicking on Add samples./i)).toBeInTheDocument();
    expect(screen.getByText(/Don't have data\? Get started using one of our example datasets:/i)).toBeInTheDocument();

    // There should be n number of example datasets
    exampleDatasets.forEach((dataset) => {
      expect(screen.getByText(dataset.description)).toBeInTheDocument();
    });

    // Clicking on one of the samples downloads the file
    const exampleFileLink = exampleDatasets[0].description;

    await act(async () => {
      userEvent.click(screen.getByText(exampleFileLink));
    });

    expect(downloadFromUrl).toHaveBeenCalledTimes(1);
  });

  it('Should not show option to download datasets if samples are available', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {samplesTableFactory()}
        </Provider>,
      );
    });

    expect(screen.queryByText(/Start uploading your samples by clicking on Add samples./i)).toBeNull();
    expect(screen.queryByText(/Don't have data\? Get started using one of our example datasets:/i)).toBeNull();
  });

  it('Should show all the samples', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {samplesTableFactory()}
        </Provider>,
      );
    });

    Object.values(samples).forEach((sample) => {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
    });
  });

  it('Renaming the sample renames the sample', async () => {
    const newSampleName = 'New Sample Name';

    const sampleNames = Object.values(samples).map((sample) => sample.name);
    const sampleNameToChange = sampleNames.shift();

    await act(async () => {
      render(
        <Provider store={storeState}>
          {samplesTableFactory()}
        </Provider>,
      );
    });

    const firstSampleEditButton = screen.getAllByLabelText(/Edit/i)[0];

    await act(async () => {
      userEvent.click(firstSampleEditButton);
    });

    const editBox = screen.getByDisplayValue(sampleNameToChange);

    await act(async () => {
      userEvent.clear(editBox);
    });

    // We have to type each letter one by one to triger
    // EditableField's "onChange" to change its value
    newSampleName.split('').forEach((letter) => {
      userEvent.type(editBox, letter);
    });

    const firstSampleSaveButton = screen.getAllByLabelText(/Save/i)[0];

    await act(async () => {
      userEvent.click(firstSampleSaveButton);
    });

    // Changed sample name should not exist
    expect(screen.queryByText(sampleNameToChange)).toBeNull();

    // New name should exist
    expect(screen.getByText(newSampleName)).toBeInTheDocument();

    // Remaining samples should still exist
    sampleNames.forEach((sampleName) => {
      expect(screen.getByText(sampleName)).toBeInTheDocument();
    });
  });

  it('Clicking delete deletes the sample', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {samplesTableFactory()}
        </Provider>,
      );
    });

    const firstSampleDeleteButton = screen.getAllByLabelText(/Delete/i)[0];

    await act(async () => {
      userEvent.click(firstSampleDeleteButton);
    });

    // The first sample should be deleted
    const sampleNames = Object.values(samples).map((sample) => sample.name);
    const deletedSampleName = sampleNames.shift();

    // Deleted sample should not exist
    expect(screen.queryByText(deletedSampleName)).toBeNull();

    // Remaining samples should still exist
    sampleNames.forEach((sampleName) => {
      expect(screen.getByText(sampleName)).toBeInTheDocument();
    });
  });
});
