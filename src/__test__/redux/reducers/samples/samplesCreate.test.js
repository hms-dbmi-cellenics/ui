import samplesCreateReducer from 'redux/reducers/samples/samplesCreate';

import initialState, { sampleTemplate } from 'redux/reducers/samples/initialState';

const projectUuid = 'projectUuid';

const newSample = {
  ...sampleTemplate,
  name: 'sampleName',
  uuid: 'uuid',
  projectUuid,
  type: '10x',
};

describe('samplesCreate', () => {
  it('returns correct state starting from initial state', () => {
    const newState = samplesCreateReducer(initialState, { payload: { sample: newSample } });

    expect(newState).toMatchSnapshot();
  });

  it('returns correct state starting from a preexisting sample', () => {
    const anotherSample = {
      ...sampleTemplate,
      name: 'oldSampleName',
      uuid: 'oldUuid',
      projectUuid,
      type: '10x',
    };

    const anotherSampleState = {
      ...initialState,
      [anotherSample.uuid]: anotherSample,
    };

    const newState = samplesCreateReducer(anotherSampleState, { payload: { sample: newSample } });

    expect(newState).toMatchSnapshot();
  });
});
