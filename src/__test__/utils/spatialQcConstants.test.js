import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { qcSteps, getUserFriendlyQCStepName, getQcStepsForTechnology } from 'utils/qcSteps';
import { spatialPlotTypes, plotTypes } from 'utils/constants';
import updateFilterSettings from 'redux/actions/experimentSettings/processingConfig/updateFilterSettings';
import { EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE } from 'redux/actionTypes/experimentSettings';

const spatialSteps = ['spatialCountDensity', 'spatialUmiOutlier', 'spatialNumGenesOutlier', 'spatialMitoOutlier'];

describe('qcSteps', () => {
  it('includes the spatial steps in canonical order', () => {
    const idx = (s) => qcSteps.indexOf(s);

    // they sit together, after doubletScores and before dataIntegration
    expect(idx('spatialCountDensity')).toBe(idx('doubletScores') + 1);
    expect(idx('spatialUmiOutlier')).toBe(idx('spatialCountDensity') + 1);
    expect(idx('spatialNumGenesOutlier')).toBe(idx('spatialUmiOutlier') + 1);
    expect(idx('spatialMitoOutlier')).toBe(idx('spatialNumGenesOutlier') + 1);
    expect(idx('dataIntegration')).toBe(idx('spatialMitoOutlier') + 1);
  });

  it('maps each spatial step to a user-friendly name', () => {
    expect(getUserFriendlyQCStepName('spatialCountDensity')).toBe('Count density filter');
    expect(getUserFriendlyQCStepName('spatialUmiOutlier')).toBe('UMI filter');
    expect(getUserFriendlyQCStepName('spatialNumGenesOutlier')).toBe('Number of genes filter');
    expect(getUserFriendlyQCStepName('spatialMitoOutlier')).toBe('Mitochondrial content filter');
  });
});

describe('getQcStepsForTechnology', () => {
  const singleCellSteps = [
    'classifier', 'cellSizeDistribution', 'mitochondrialContent', 'numGenesVsNumUmis',
    'doubletScores', 'dataIntegration', 'configureEmbedding',
  ];

  it('keeps the single-cell steps unchanged for non-spatial technologies', () => {
    ['10x', 'rhapsody', 'parse', 'seurat_object', undefined].forEach((technology) => {
      expect(getQcStepsForTechnology(technology)).toEqual(singleCellSteps);
    });
  });

  it('runs the three metric filters for Visium HD', () => {
    expect(getQcStepsForTechnology('visium_hd')).toEqual([
      'spatialUmiOutlier', 'spatialNumGenesOutlier', 'spatialMitoOutlier',
      'dataIntegration', 'configureEmbedding',
    ]);
  });

  it('runs count density, UMI and gene filters (no mito) for Xenium', () => {
    expect(getQcStepsForTechnology('xenium')).toEqual([
      'spatialCountDensity', 'spatialUmiOutlier', 'spatialNumGenesOutlier',
      'dataIntegration', 'configureEmbedding',
    ]);
  });
});

describe('spatialPlotTypes constant', () => {
  it('contains exactly the spatial plot types', () => {
    expect(spatialPlotTypes).toEqual([
      plotTypes.SPATIAL_CATEGORICAL,
      plotTypes.SPATIAL_FEATURE,
      plotTypes.SPATIAL_MOLECULES,
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
