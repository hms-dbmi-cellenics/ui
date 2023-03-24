import '@testing-library/jest-dom';

import { experiments, samples } from '__test__/test-utils/mockData';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { loadExperiments, setActiveExperiment } from 'redux/actions/experiments';
import mockAPI, { generateDefaultMockAPIResponses, promiseResponse, statusResponse } from '__test__/test-utils/mockAPI';
import { render, screen, waitFor } from '@testing-library/react';

import { Provider } from 'react-redux';
import React from 'react';
import SamplesTable from 'components/data-management/SamplesTable';
import _ from 'lodash';
import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';
import { loadSamples } from 'redux/actions/samples';
import { loadUser } from 'redux/actions/user';
import { makeStore } from 'redux/store';
import mockDemoExperiments from '__test__/test-utils/mockData/mockDemoExperiments.json';
import thunk from 'redux-thunk';
import userEvent from '@testing-library/user-event';

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));
jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn(() => Promise.resolve({
    attributes: {
      name: 'mockUserName',
      'custom:agreed_terms': 'true',
    },
  })),
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

jest.mock('utils/downloadFromUrl');

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
  let renderComponents;

  await act(async () => {
    renderComponents = render(
      <Provider store={store}>
        <div style={{ minHeight: '200px', minWidth: '500px' }}>
          {samplesTableFactory()}
        </div>
      </Provider>,
    );
  });

  return renderComponents;
};

enableFetchMocks();

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const experimentWithSamplesId = experimentWithSamples.id;
const experimentWithoutSamplesId = experimentWithoutSamples.id;

const experimentCloneId = 'mockExperimentCloneId';

// Mocking samples update / delete routes
const customResponses = {
  [`experiments/${experimentWithSamplesId}/samples/${experimentWithSamples.samplesOrder[0]}`]: () => statusResponse(200, 'OK'),
  [`experiments/${experimentWithSamplesId}/samples/position`]: () => statusResponse(200, 'OK'),
  [`experiments/${mockDemoExperiments[0].id}/clone`]: () => promiseResponse(JSON.stringify(experimentCloneId)),
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

    await storeState.dispatch(loadUser());
    await storeState.dispatch(loadExperiments());

    // Loading experiment is usually called in Data Management, so we have to load them manually
    await storeState.dispatch(loadSamples(experimentWithSamplesId));

    // Defaults to project with samples
    await storeState.dispatch(setActiveExperiment(experimentWithSamplesId));
    await storeState.dispatch(loadDeploymentInfo({ environment: 'test' }));
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

  it('Should not show the samples until they are loaded', async () => {
    const missingSampleState = _.cloneDeep(storeState.getState());

    const createMockStore = configureMockStore([thunk]);

    // Remove one of the samples of the experiment
    const deletedSampleUuid = Object.keys(missingSampleState.samples).find((key) => key !== 'meta');
    delete missingSampleState.samples[deletedSampleUuid];

    const missingSampleStore = createMockStore(missingSampleState);

    await renderSamplesTable(missingSampleStore);

    Object.values(samples).forEach((sample) => {
      expect(screen.queryByText(sample.name)).not.toBeInTheDocument();
    });
  });

  it('Should NOT show the samples until theres validation going on for active experiment', async () => {
    const validatingExpState = _.cloneDeep(storeState.getState());
    const createMockStore = configureMockStore([thunk]);

    // Set the active experiment as being validated
    validatingExpState.samples.meta.validating = [experimentWithSamplesId];

    const validatingExpStore = createMockStore(validatingExpState);

    await renderSamplesTable(validatingExpStore);

    Object.values(samples).forEach((sample) => {
      expect(screen.queryByText(sample.name)).not.toBeInTheDocument();
    });

    expect(screen.getByText('We\'re validating your samples ...')).toBeDefined();
  });

  it('Should show the samples if theres validation going on but not for active experiment', async () => {
    const validatingExpState = _.cloneDeep(storeState.getState());
    const createMockStore = configureMockStore([thunk]);

    // Set the active experiment as being validated
    validatingExpState.samples.meta.validating = ['inactiveExperiment'];

    const validatingExpStore = createMockStore(validatingExpState);

    await renderSamplesTable(validatingExpStore);

    Object.values(samples).forEach((sample) => {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
    });

    expect(screen.queryByText('We\'re validating your samples ...')).not.toBeInTheDocument();
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

  it('Example experiments show up in an empty experiment', async () => {
    await renderSamplesTable(storeState);

    await storeState.dispatch(setActiveExperiment(experimentWithoutSamplesId));

    waitFor(() => {
      expect(screen.getByText(/Start uploading your samples by clicking on Add samples./i)).toBeInTheDocument();
      expect(screen.getByText(/Don't have data\? Get started using one of our example datasets!/i)).toBeInTheDocument();
    });
  });
});
