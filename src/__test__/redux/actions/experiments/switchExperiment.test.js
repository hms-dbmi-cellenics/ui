import { switchExperiment, loadExperiments } from 'redux/actions/experiments';
import _ from 'lodash';
import mockAPI, {
  generateDefaultMockAPIResponses,

} from '__test__/test-utils/mockAPI';
import { makeStore } from 'redux/store';
import { loadProjects, setActiveProject } from 'redux/actions/projects';
import { projects } from '__test__/test-utils/mockData';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

let store = null;

const projectWithSamples = projects.find((project) => project.samples.length > 0);
const projectWithoutSamples = projects.find((project) => project.samples.length === 0);

const experimentWithSamplesId = projectWithSamples.experiments[0];
const projectWithSamplesId = projectWithSamples.uuid;

const experimentWithoutSamplesId = projectWithoutSamples.experiments[0];
const projectWithoutSamplesId = projectWithoutSamples.uuid;

enableFetchMocks();

const mockAPIResponses = _.merge(
  generateDefaultMockAPIResponses(experimentWithSamplesId, projectWithSamplesId),
  generateDefaultMockAPIResponses(experimentWithoutSamplesId, projectWithoutSamplesId),
);

describe('switch experiment ', () => {
  beforeEach(async () => {
    fetchMock.resetMocks();
    fetchMock.doMockIf();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    store = makeStore();
    await store.dispatch(loadProjects());
    await store.dispatch(loadExperiments(projectWithSamplesId));
    await store.dispatch(loadExperiments(projectWithoutSamplesId));
    await store.dispatch(setActiveProject(projectWithoutSamplesId));
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
