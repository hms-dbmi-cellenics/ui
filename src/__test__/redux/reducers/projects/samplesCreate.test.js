import _ from 'lodash';

import samplesCreateReducer from 'redux/reducers/experiments/samplesCreate';

import { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

const experimentId = 'experiment-1';

const newSample = {
  ...sampleTemplate,
  name: 'sampleName',
  uuid: 'uuid',
  projectUuid: experimentId,
  type: '10x',
};

const experiment = {
  ...experimentTemplate,
  name: 'test experiment',
  id: experimentId,
  description: 'this is a test description',
  createdAt: '01-01-2021',
  updatedAt: '01-01-2021',
};

const oneExperimentState = {
  ...initialState,
  ids: [...initialState.ids, experimentId],
  meta: {
    activeExperimentId: experimentId,
  },
  [experimentId]: experiment,
};

describe('samplesCreate', () => {
  it('returns correct state if previous state was initial', () => {
    const newState = samplesCreateReducer(oneExperimentState, { payload: { sample: newSample } });

    expect(newState).toMatchSnapshot();
  });

  it('returns correct state when experiment already had a sample', () => {
    const experimentWithSampleState = _.cloneDeep(oneExperimentState);
    experimentWithSampleState[experimentId].samples.push('oldSampleUuid');

    const newState = samplesCreateReducer(oneExperimentState, { payload: { sample: newSample } });

    expect(newState).toMatchSnapshot();
  });
});
