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
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import { loadProjects, setActiveProject } from 'redux/actions/projects';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import { loadExperiments } from 'redux/actions/experiments';

import reactSortableHoc from 'react-sortable-hoc';

import { api } from 'utils/constants';
import config from 'config';

jest.mock('config');

jest.mock('@aws-amplify/storage', () => ({
  get: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
}));

jest.mock('utils/data-management/downloadFromUrl');

jest.mock('react-sortable-hoc', () => ({
  sortableContainer: jest.fn(jest.requireActual('react-sortable-hoc').sortableContainer),
  sortableHandle: jest.fn(jest.requireActual('react-sortable-hoc').sortableHandle),
  sortableElement: jest.fn(jest.requireActual('react-sortable-hoc').sortableElement),
}));

const defaultProps = {
  height: 100,
};

const samplesTableFactory = createTestComponentFactory(SamplesTable, defaultProps);
const renderSamplesTable = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {samplesTableFactory()}
      </Provider>,
    );
  });
};

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
  [`/v2/experiments/${projectIdWithSamples}/samples/position`]: () => statusResponse(200, 'OK'),
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

    config.currentApiVersion = api.V1;

    storeState = makeStore();

    await storeState.dispatch(loadProjects());

    // Loading experiment is usually called in Data Management, so we have to load them manually
    await storeState.dispatch(loadExperiments(projectIdWithSamples));
    await storeState.dispatch(loadExperiments(projectIdWithoutSamples));

    // Defaults to project with samples
    await storeState.dispatch(setActiveProject(projectIdWithSamples));
  });

  it('Shows option to download datasets if there are no samples', async () => {
    await renderSamplesTable(storeState);

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
    await renderSamplesTable(storeState);

    expect(screen.queryByText(/Start uploading your samples by clicking on Add samples./i)).toBeNull();
    expect(screen.queryByText(/Don't have data\? Get started using one of our example datasets:/i)).toBeNull();
  });

  it('Should show all the samples', async () => {
    await renderSamplesTable(storeState);

    Object.values(samples).forEach((sample) => {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
    });
  });

  it('Should show an error if a sample fails to upload', async () => {
    const missingSampleState = _.cloneDeep(storeState.getState());
    const createMockStore = configureMockStore([thunk]);

    // Delete one of the samples
    const deletedSampleUuid = Object.keys(missingSampleState.samples).find((key) => key !== 'meta');
    const deletedSampleObject = missingSampleState.samples[deletedSampleUuid];
    delete missingSampleState.samples[deletedSampleUuid];

    const missingSampleStore = createMockStore(missingSampleState);

    await renderSamplesTable(missingSampleStore);

    // The sample name should not be in the document
    expect(screen.queryByText(deletedSampleObject.name)).toBeNull();

    // There should be an error entry for the missing sample
    expect(screen.getByText(/UPLOAD ERROR: Please reupload sample/i)).toBeInTheDocument();
  });

  it('Renaming the sample renames the sample', async () => {
    const newSampleName = 'New Sample Name';

    const sampleNames = Object.values(samples).map((sample) => sample.name);
    const sampleNameToChange = sampleNames.shift();

    await renderSamplesTable(storeState);

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
    await renderSamplesTable(storeState);

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

  it('Reorder samples works in api v2', async () => {
    config.currentApiVersion = api.V2;

    let onSortEndProp;
    reactSortableHoc.sortableContainer.mockImplementationOnce(() => (...params) => {
      onSortEndProp = params[0].onSortEnd;
      return (<></>);
    });

    await renderSamplesTable(storeState);

    // const firstSample = screen.getByText(Object.values(samples)[0].name);

    await act(async () => {
      onSortEndProp({ oldIndex: 0, newIndex: 5 });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${projectIdWithSamples}/samples/position`,
      {
        method: 'PUT',
        headers: expect.anything(),
        body: '{"oldPosition":0,"newPosition":5}',
      },
    );
  });
});
