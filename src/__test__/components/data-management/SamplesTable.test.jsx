import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import reactSortableHoc from 'react-sortable-hoc';

import _ from 'lodash';
import { Provider } from 'react-redux';

import mockAPI, { generateDefaultMockAPIResponses, promiseResponse, statusResponse } from '__test__/test-utils/mockAPI';
import { experiments, responseData, samples } from '__test__/test-utils/mockData';

import SamplesTable from 'components/data-management/SamplesTable';
import { makeStore } from 'redux/store';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import { loadProjects, setActiveProject } from 'redux/actions/projects';

import loadEnvironment from 'redux/actions/networkResources/loadEnvironment';
import { loadExperiments } from 'redux/actions/experiments';
import { loadSamples } from 'redux/actions/samples';

import mockDemoExperiments from '__test__/test-utils/mockData/mockDemoExperiments.json';

jest.mock('config');

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn(() => Promise.resolve({ attributes: { name: 'mockUserName' } })),
  federatedSignIn: jest.fn(),
}));

// Necessary due to storage being used in the default SamplesTable.
jest.mock('@aws-amplify/storage', () => ({
  configure: jest.fn(),
  get: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
  list: jest.fn(() => Promise.resolve([
    { key: '2.Another-Example_no.2.zip' },
    { key: '1.Example_1.zip' },
  ])),
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

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const experimentWithSamplesId = experimentWithSamples.id;
const experimentWithoutSamplesId = experimentWithoutSamples.id;

// Mocking samples update / delete routes
const customResponses = {
  [`experiments/${experimentWithSamplesId}/samples/${experimentWithSamples.samplesOrder[0]}`]: () => statusResponse(200, 'OK'),
  [`experiments/${experimentWithSamplesId}/samples/position`]: () => statusResponse(200, 'OK'),
  [`experiments/${mockDemoExperiments[0].id}/clone/${experimentWithoutSamplesId}`]: () => statusResponse(200, 'OK'),
};

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentWithSamplesId),
  generateDefaultMockAPIResponses(experimentWithoutSamplesId),
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
    await storeState.dispatch(loadExperiments(experimentWithSamplesId));
    await storeState.dispatch(loadExperiments(experimentWithoutSamplesId));
    await storeState.dispatch(loadSamples(experimentWithSamplesId));

    // Defaults to project with samples
    await storeState.dispatch(setActiveProject(experimentWithSamplesId));
    await storeState.dispatch(loadEnvironment('test'));
  });

  it('Does not show prompt to upload datasets if samples are available', async () => {
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

  it('Reorder samples send correct request in api v2', async () => {
    let onSortEndProp;
    reactSortableHoc.sortableContainer.mockImplementationOnce(() => (...params) => {
      onSortEndProp = params[0].onSortEnd;
      return <></>;
    });

    await renderSamplesTable(storeState);

    await act(async () => {
      onSortEndProp({ oldIndex: 0, newIndex: 5 });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experimentWithSamplesId}/samples/position`,
      {
        method: 'PUT',
        headers: expect.anything(),
        body: '{"oldPosition":0,"newPosition":5}',
      },
    );
  });

  describe('Example experiments functionality', () => {
    beforeEach(async () => {
      await renderSamplesTable(storeState);

      // Load project without samples
      await act(async () => {
        await storeState.dispatch(setActiveProject(experimentWithoutSamplesId));
      });
    });

    it('Example experiments show up in an empty experiment', async () => {
      expect(screen.getByText(/Start uploading your samples by clicking on Add samples./i)).toBeInTheDocument();
      expect(screen.getByText(/Don't have data\? Get started using one of our example datasets:/i)).toBeInTheDocument();

      const exampleExperimentNames = _.map(mockDemoExperiments, 'name');

      exampleExperimentNames.forEach((name) => {
        expect(screen.getByText(name)).toBeDefined();
      });
    });

    it('Cloning from example experiments works correctly', async () => {
      // Clear mock calls so we can distinguish the new calls made from the old ones
      fetchMock.mockClear();

      const newExperimentsResponse = _.cloneDeep(responseData.experiments);
      const noSamplesExperiment = newExperimentsResponse.find(
        ({ id }) => id === experimentWithoutSamplesId,
      );
      noSamplesExperiment.samplesOrder = mockDemoExperiments[0].samplesOrder;
      const newApiResponses = _.merge(
        mockAPIResponse,
        { experiments: () => promiseResponse(JSON.stringify(newExperimentsResponse)) },
      );
      fetchMock.mockIf(/.*/, mockAPI(newApiResponses));

      await act(async () => {
        userEvent.click(screen.getByText(mockDemoExperiments[0].name));
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:3000/v2/experiments/${mockDemoExperiments[0].id}/clone/${experimentWithoutSamplesId}`,
        expect.objectContaining({ method: 'POST' }),
      );

      // Reloads experiments
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/v2/experiments',
        { headers: {} },
      );

      // Reloads samples for the active experiment
      // (because the samples changed, it wouldnt otherwise)
      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:3000/v2/experiments/${experimentWithoutSamplesId}/samples`,
        { headers: {} },
      );
    });
  });
});
