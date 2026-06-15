import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { qcSteps, getUserFriendlyQCStepName } from 'utils/qcSteps';
import { spatialPlotTypes, plotTypes } from 'utils/constants';
import updateFilterSettings from 'redux/actions/experimentSettings/processingConfig/updateFilterSettings';
import { EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE } from 'redux/actionTypes/experimentSettings';

const spatialSteps = ['spatialUmiOutlier', 'spatialNumGenesOutlier', 'spatialMitoOutlier'];

describe('qcSteps', () => {
  it('includes the three spatial outlier steps in canonical order', () => {
    spatialSteps.forEach((step) => expect(qcSteps).toContain(step));

    // they sit together, after doubletScores and before dataIntegration
    const idx = (s) => qcSteps.indexOf(s);
    expect(idx('spatialUmiOutlier')).toBeGreaterThan(idx('doubletScores'));
    expect(idx('spatialMitoOutlier')).toBeLessThan(idx('dataIntegration'));
    expect(idx('spatialNumGenesOutlier')).toBe(idx('spatialUmiOutlier') + 1);
    expect(idx('spatialMitoOutlier')).toBe(idx('spatialNumGenesOutlier') + 1);
  });

  it('maps each spatial step to a user-friendly name', () => {
    expect(getUserFriendlyQCStepName('spatialUmiOutlier')).toBe('UMI filter');
    expect(getUserFriendlyQCStepName('spatialNumGenesOutlier')).toBe('Number of genes filter');
    expect(getUserFriendlyQCStepName('spatialMitoOutlier')).toBe('Mitochondrial content filter');
  });
});

describe('spatialPlotTypes constant', () => {
  it('contains exactly the two spatial plot types', () => {
    expect(spatialPlotTypes).toEqual([
      plotTypes.SPATIAL_CATEGORICAL,
      plotTypes.SPATIAL_FEATURE,
    ]);
  });
});

describe('updateFilterSettings — spatial steps are sample-specific', () => {
  const mockStore = configureStore([thunk]);

  it.each(spatialSteps)('dispatches a SAMPLE filter update for %s with a sampleId', (step) => {
    const store = mockStore({});
    store.dispatch(updateFilterSettings(step, { foo: 'bar' }, 'sample-1'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe(EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE);
    expect(actions[0].payload).toMatchObject({ step, sampleId: 'sample-1' });
  });

  it.each(spatialSteps)('throws for %s when no sampleId is supplied', (step) => {
    const store = mockStore({});
    expect(() => store.dispatch(updateFilterSettings(step, { foo: 'bar' })))
      .toThrow(`sampleId is undefined, but step: ${step} received needs a sampleId`);
  });
});
