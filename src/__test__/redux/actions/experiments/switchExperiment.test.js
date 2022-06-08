// import { switchExperiment, loadExperiments } from 'redux/actions/experiments';
import { switchExperiment } from 'redux/actions/experiments';
import _ from 'lodash';
import mockAPI, {
  generateDefaultMockAPIResponses,

} from '__test__/test-utils/mockAPI';
import { makeStore } from 'redux/store';
import { loadProjects, setActiveProject } from 'redux/actions/projects';
// import { projects } from '__test__/test-utils/mockData';
import { responseData } from '__test__/test-utils/mockData';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

let store = null;

const { experiments } = responseData;

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const experimentWithSamplesId = experimentWithSamples[0].id;
const experimentWithoutSamplesId = experimentWithoutSamples[0].id;

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
    // await store.dispatch(loadExperiments(projectWithSamplesId));
    // await store.dispatch(loadExperiments(projectWithoutSamplesId));
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
