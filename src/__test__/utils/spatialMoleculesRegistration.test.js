import {
  plotTypes, plotNames, plotUuids, spatialPlotTypes, spatialPlotNames,
  moleculeTechs, sampleTech,
} from 'utils/constants';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

describe('Spatial Molecules plot type registration', () => {
  it('defines a SPATIAL_MOLECULES plot type with matching name + uuid', () => {
    expect(plotTypes.SPATIAL_MOLECULES).toBe('SpatialMolecules');
    expect(plotNames.SPATIAL_MOLECULES).toBeDefined();
    expect(plotUuids.SPATIAL_MOLECULES).toBeDefined();
  });

  it('lists the plot type / name among the spatial plots', () => {
    expect(spatialPlotTypes).toContain(plotTypes.SPATIAL_MOLECULES);
    expect(spatialPlotNames).toContain(plotNames.SPATIAL_MOLECULES);
  });

  it('registers an initial config with selectedGenes and marker fields', () => {
    const config = initialPlotConfigStates[plotTypes.SPATIAL_MOLECULES];
    expect(config).toBeDefined();
    expect(config.selectedGenes).toEqual([]);
    expect(config.nmols).toBeUndefined();
    expect(config.marker).toBeDefined();
    expect(typeof config.marker.size).toBe('number');
    expect(typeof config.marker.opacity).toBe('number');
  });

  it('defaults the segmentation overlay on and an empty per-gene colour map', () => {
    const config = initialPlotConfigStates[plotTypes.SPATIAL_MOLECULES];
    expect(config.showSegmentations).toBe(true);
    expect(config.geneColors).toEqual({});
    // these auto-populated fields survive a reset
    expect(config.keepValuesOnReset).toEqual(
      expect.arrayContaining(['geneColors', 'showSegmentations']),
    );
  });

  it('gates the plot to molecule-capable techs (Xenium)', () => {
    expect(moleculeTechs).toContain(sampleTech.XENIUM);
    // not offered for a non-spatial tech
    expect(moleculeTechs).not.toContain(sampleTech['10X']);
  });
});
