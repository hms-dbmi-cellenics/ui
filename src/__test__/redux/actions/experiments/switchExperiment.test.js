import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';
import { setActiveProject } from 'redux/actions/projects';
import { loadExperiments, loadExperiment, switchExperiment } from 'redux/actions/experiments';
import { loadSamples } from 'redux/actions/samples';

import { responseData } from '__test__/test-utils/mockData';
import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

let store = null;

const { experiments } = responseData;

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const experimentWithSamplesId = experimentWithSamples.id;
const experimentWithoutSamplesId = experimentWithoutSamples.id;

enableFetchMocks();

const mockAPIResponses = _.merge(
  generateDefaultMockAPIResponses(experimentWithSamplesId),
  generateDefaultMockAPIResponses(experimentWithoutSamplesId),
);

describe('switch experiment ', () => {
  beforeEach(async () => {
    fetchMock.resetMocks();
    fetchMock.doMockIf();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    store = makeStore();
    await store.dispatch(loadExperiments());
    await store.dispatch(loadExperiment(experimentWithSamplesId));
    await store.dispatch(loadSamples(experimentWithSamplesId));
    await store.dispatch(loadExperiment(experimentWithoutSamplesId));
    await store.dispatch(setActiveProject(experimentWithoutSamplesId));
  });

  it('switches the experiment to its initial values', async () => {
    await store.dispatch(switchExperiment(experimentWithSamplesId));

    expect(store.getState()).toMatchSnapshot();
  });

  it('Then updates the experiment info', async () => {
    await store.dispatch(switchExperiment(experimentWithSamplesId));

    expect(store.getState()).toMatchSnapshot();
  });
});
