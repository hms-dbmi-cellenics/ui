import { loadExperiments, switchExperiment } from 'redux/actions/experiments';
import _ from 'lodash';
import mockAPI, {
  generateDefaultMockAPIResponses,

} from '__test__/test-utils/mockAPI';
import { makeStore } from 'redux/store';
import { loadProjects, setActiveProject } from 'redux/actions/projects';
import { responseData } from '__test__/test-utils/mockData';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { loadSamples } from 'redux/actions/samples';

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
    await store.dispatch(loadProjects());
    await store.dispatch(loadExperiments(experimentWithSamplesId));
    await store.dispatch(loadSamples(experimentWithSamplesId));
    await store.dispatch(loadExperiments(experimentWithoutSamplesId));
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
