import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

// Invariants of the spatial local-outlier filter plot configs added on init-spatial.
describe('spatial outlier plot configs', () => {
  const metricPlots = [
    'spatialUmiOutlierPlot',
    'spatialNumGenesOutlierPlot',
    'spatialMitoOutlierPlot',
  ];
  const highlightPlots = [
    'spatialUmiOutlierHighlightPlot',
    'spatialNumGenesOutlierHighlightPlot',
    'spatialMitoOutlierHighlightPlot',
  ];
  const histograms = [
    'spatialUmiOutlierZscoreHistogram',
    'spatialNumGenesOutlierZscoreHistogram',
    'spatialMitoOutlierZscoreHistogram',
  ];

  it('registers every spatial outlier config in initialPlotConfigStates', () => {
    [...metricPlots, ...highlightPlots, ...histograms].forEach((key) => {
      expect(initialPlotConfigStates[key]).toBeDefined();
    });
  });

  describe('metric slide configs', () => {
    it('use the default gradient and hide the tissue image', () => {
      metricPlots.forEach((key) => {
        const config = initialPlotConfigStates[key];
        expect(config.colour.gradient).toBe('default');
        expect(config.showImage).toBe(false);
      });
    });

    it('repurpose shownGene as the colour-legend (metric) title', () => {
      expect(initialPlotConfigStates.spatialUmiOutlierPlot.shownGene).toBe('UMIs');
      expect(initialPlotConfigStates.spatialNumGenesOutlierPlot.shownGene).toBe('Genes detected');
      expect(initialPlotConfigStates.spatialMitoOutlierPlot.shownGene).toBe('Mitochondrial %');
    });

    it('reverse the colour bar for UMI and numGenes (low value = outlier = red)', () => {
      expect(initialPlotConfigStates.spatialUmiOutlierPlot.colour.reverseCbar).toBe(true);
      expect(initialPlotConfigStates.spatialNumGenesOutlierPlot.colour.reverseCbar).toBe(true);
    });

    it('does NOT reverse the colour bar for mito (high value = outlier = red)', () => {
      expect(initialPlotConfigStates.spatialMitoOutlierPlot.colour.reverseCbar).toBeFalsy();
    });

    it('clears keepValuesOnReset and disables value truncation', () => {
      metricPlots.forEach((key) => {
        const config = initialPlotConfigStates[key];
        expect(config.keepValuesOnReset).toEqual([]);
        expect(config.truncatedValues).toBe(false);
      });
    });
  });

  describe('highlight slide configs', () => {
    it('hide the tissue image', () => {
      highlightPlots.forEach((key) => {
        expect(initialPlotConfigStates[key].showImage).toBe(false);
      });
    });

    it('are independent objects from their metric-slide counterparts', () => {
      expect(initialPlotConfigStates.spatialUmiOutlierHighlightPlot)
        .not.toBe(initialPlotConfigStates.spatialUmiOutlierPlot);
    });
  });

  describe('z-score histogram configs', () => {
    it('carry a default cutoff of 3', () => {
      histograms.forEach((key) => {
        expect(initialPlotConfigStates[key].cutoff).toBe(3);
      });
    });

    it('set a per-metric x-axis title and a Frequency y-axis title', () => {
      expect(initialPlotConfigStates.spatialUmiOutlierZscoreHistogram.axes.xAxisText)
        .toBe('UMI outlier z-score');
      expect(initialPlotConfigStates.spatialNumGenesOutlierZscoreHistogram.axes.xAxisText)
        .toBe('Genes detected outlier z-score');
      expect(initialPlotConfigStates.spatialMitoOutlierZscoreHistogram.axes.xAxisText)
        .toBe('Mitochondrial outlier z-score');
      histograms.forEach((key) => {
        expect(initialPlotConfigStates[key].axes.yAxisText).toBe('Frequency');
      });
    });
  });
});

// Plots & Tables spatial plots default selectedSample to null and auto-populate the
// first sample on mount. selectedSample must be in keepValuesOnReset so that write
// doesn't keep the Reset Plot button enabled after a reset.
describe('spatial Plots & Tables configs — reset behaviour', () => {
  ['SpatialFeature', 'SpatialCategorical'].forEach((key) => {
    it(`${key} keeps selectedSample on reset`, () => {
      const config = initialPlotConfigStates[key];
      expect(config.selectedSample).toBeNull();
      expect(config.keepValuesOnReset).toEqual(expect.arrayContaining(['selectedSample']));
    });
  });
});
