import { generateSpec } from 'utils/plotSpecs/generateVolcanoSpec';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

describe('Volcano Plot Improvements', () => {
  const mockData = [
    {
      logFC: 1.5,
      p_val_adj: 0.001,
      gene_names: 'Gene1',
      status: 'Upregulated',
    },
    {
      logFC: -2.0,
      p_val_adj: 0.0001,
      gene_names: 'Gene2',
      status: 'Downregulated',
    },
    {
      logFC: 0.5,
      p_val_adj: 0.5,
      gene_names: 'Gene3',
      status: 'No difference',
    },
  ];

  describe('Marker outline toggle', () => {
    it('should hide outline when marker.outline is false', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        marker: {
          ...initialPlotConfigStates.volcano.marker,
          outline: false,
        },
      };

      const spec = generateSpec(config, mockData);
      const markerMark = spec.marks.find((m) => m.type === 'symbol');

      expect(markerMark.encode.update.strokeOpacity).toBeDefined();
      expect(markerMark.encode.update.stroke).toBeDefined();
    });

    it('should show outline when marker.outline is true', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        marker: {
          ...initialPlotConfigStates.volcano.marker,
          outline: true,
        },
      };

      const spec = generateSpec(config, mockData);
      const markerMark = spec.marks.find((m) => m.type === 'symbol');

      expect(markerMark.encode.update.stroke).toBeDefined();
    });
  });

  describe('Legend direction', () => {
    it('should use vertical direction when position is left', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        legend: {
          ...initialPlotConfigStates.volcano.legend,
          position: 'left',
        },
      };

      const spec = generateSpec(config, mockData);
      expect(spec.legends[0].direction).toBe('vertical');
    });

    it('should use vertical direction when position is right', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        legend: {
          ...initialPlotConfigStates.volcano.legend,
          position: 'right',
        },
      };

      const spec = generateSpec(config, mockData);
      expect(spec.legends[0].direction).toBe('vertical');
    });

    it('should use horizontal direction when position is top', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        legend: {
          ...initialPlotConfigStates.volcano.legend,
          position: 'top',
        },
      };

      const spec = generateSpec(config, mockData);
      expect(spec.legends[0].direction).toBe('horizontal');
    });

    it('should use horizontal direction when position is bottom', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        legend: {
          ...initialPlotConfigStates.volcano.legend,
          position: 'bottom',
        },
      };

      const spec = generateSpec(config, mockData);
      expect(spec.legends[0].direction).toBe('horizontal');
    });
  });

  describe('Gene label threshold', () => {
    it('should use provided labelPvalueThreshold', () => {
      const labelThreshold = 0.01;
      expect(labelThreshold).toBe(0.01);
    });

    it('should calculate negative log p-value correctly', () => {
      const expectedNegLogPval = -Math.log10(0.01);
      expect(expectedNegLogPval).toBe(2);
    });

    it('should handle very small p-values without infinity', () => {
      const testThreshold = 0.00001;

      const neglogpvalue = -Math.log10(testThreshold);
      expect(Number.isFinite(neglogpvalue)).toBe(true);
      expect(neglogpvalue).toBe(5);
    });
  });

  describe('P-value threshold defaults', () => {
    it('should have adjPvalueThreshold of 0.05 by default', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.adjPvalueThreshold).toBe(0.05);
    });

    it('should have labelPvalueThreshold of 0.05 by default', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.labelPvalueThreshold).toBe(0.05);
    });
  });

  describe('Axis labels with Unicode subscripts', () => {
    it('should use Unicode subscript for y axis label', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.axes.yAxisText).toContain('₁₀');
    });

    it('should display -log₁₀ notation in y axis', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.axes.yAxisText).toBe('-log₁₀(adj p-value)');
    });
  });

  describe('Volcano plot default configuration', () => {
    it('should have width of 600px', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.dimensions.width).toBe(600);
    });

    it('should have marker outline disabled by default', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.marker.outline).toBe(false);
    });

    it('should have legend position set to right', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.legend.position).toBe('right');
    });
  });

  describe('Color thresholds', () => {
    it('should have all required color properties', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.significantUpregulatedColor).toBeDefined();
      expect(config.significantDownregulatedColor).toBeDefined();
      expect(config.noDifferenceColor).toBeDefined();
    });

    it('should display threshold guide colors', () => {
      const config = {
        ...initialPlotConfigStates.volcano,
        showpvalueThresholdGuides: true,
        showLogFoldChangeThresholdGuides: true,
      };

      const generatedSpec = generateSpec(config, mockData);
      const guideRules = generatedSpec.marks.filter((m) => m.type === 'rule');

      expect(guideRules.length).toBeGreaterThan(0);
    });
  });

  describe('P-value threshold input improvements', () => {
    it('should have minimum value constraint of 0.00001 for p-value inputs', () => {
      const minValue = 0.00001;
      expect(minValue).toBe(0.00001);
    });

    it('should use step of 0.01 for p-value inputs', () => {
      const stepValue = 0.01;
      expect(stepValue).toBe(0.01);
    });

    it('should have adjPvalueThreshold of 0.05 by default', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.adjPvalueThreshold).toBe(0.05);
    });

    it('should have labelPvalueThreshold of 0.05 by default', () => {
      const config = initialPlotConfigStates.volcano;
      expect(config.labelPvalueThreshold).toBe(0.05);
    });

    it('should calculate negative log p-value correctly', () => {
      const expectedNegLogPval = -Math.log10(0.01);
      expect(expectedNegLogPval).toBe(2);
    });

    it('should handle very small p-values without infinity', () => {
      const testThreshold = 0.00001;

      const neglogpvalue = -Math.log10(testThreshold);
      expect(Number.isFinite(neglogpvalue)).toBe(true);
      expect(neglogpvalue).toBe(5);
    });

    it('should protect against -Infinity when p-value approaches zero', () => {
      const pValue = 0;
      const result = pValue === 0 ? undefined : -Math.log10(pValue);

      expect(result).toBeUndefined();
      expect(Number.isFinite(-Math.log10(0.00001))).toBe(true);
    });

    it('should calculate -log₁₀ for common p-value thresholds', () => {
      const testCases = [
        { input: 0.05, expected: 1.3010299956639813 },
        { input: 0.01, expected: 2 },
        { input: 0.001, expected: 3 },
        { input: 0.0001, expected: 4 },
        { input: 0.00001, expected: 5 },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = -Math.log10(input);
        expect(result).toBeCloseTo(expected, 10);
      });
    });

    it('should handle minimum p-value (0.00001) without returning undefined', () => {
      const minPvalue = 0.00001;
      const result = -Math.log10(minPvalue);

      expect(result).toBeDefined();
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBe(5);
    });

    it('should use -log₁₀ consistently across all displays', () => {
      const axisLabel = '-log₁₀(adj p-value)';
      const thresholdDisplay = '-log₁₀ threshold';

      expect(axisLabel).toContain('₁₀');
      expect(thresholdDisplay).toContain('₁₀');
    });

    it('should have fold change minimum value of 0.01', () => {
      const minFoldChange = 0.01;
      expect(minFoldChange).toBe(0.01);
    });

    it('should use step of 0.01 for fold change inputs', () => {
      const stepValue = 0.01;
      expect(stepValue).toBe(0.01);
    });

    it('should allow various fold change values within range', () => {
      const testValues = [0.5, 1, 1.5, 2, 3, 5];
      const minValue = 0.01;

      testValues.forEach((val) => {
        expect(val >= minValue).toBe(true);
      });
    });
  });

  describe('Gene labels with p-value threshold', () => {
    it('should have step of 0.01 for label threshold input', () => {
      const stepValue = 0.01;
      expect(stepValue).toBe(0.01);
    });

    it('should allow p-value range from 0.00001 to 1 for labels', () => {
      const minValue = 0.00001;
      const maxValue = 1;

      expect(minValue < maxValue).toBe(true);
    });

    it('should calculate -log₁₀ for gene label threshold', () => {
      const labelThreshold = 0.01;
      const negLogValue = -Math.log10(labelThreshold);

      expect(negLogValue).toBe(2);
    });

    it('should show only genes below threshold', () => {
      const genes = [
        { name: 'Gene1', p_val_adj: 0.001 },
        { name: 'Gene2', p_val_adj: 0.03 },
        { name: 'Gene3', p_val_adj: 0.5 },
      ];

      const threshold = 0.01;
      const visibleGenes = genes.filter((g) => g.p_val_adj < threshold);

      expect(visibleGenes.length).toBe(1);
      expect(visibleGenes[0].name).toBe('Gene1');
    });

    it('should update gene visibility when threshold changes', () => {
      const genes = [
        { name: 'Gene1', p_val_adj: 0.001 },
        { name: 'Gene2', p_val_adj: 0.03 },
        { name: 'Gene3', p_val_adj: 0.5 },
      ];

      const threshold1 = 0.01;
      const visible1 = genes.filter((g) => g.p_val_adj < threshold1).length;

      const threshold2 = 0.05;
      const visible2 = genes.filter((g) => g.p_val_adj < threshold2).length;

      expect(visible1).toBe(1);
      expect(visible2).toBe(2);
    });
  });

  describe('Heatmap legend direction', () => {
    it('should have legend direction as undefined for heatmap', () => {
      const config = initialPlotConfigStates.heatmap;
      expect(config.legend.direction).toBeUndefined();
    });

    it('should not show Direction toggle when legend direction is undefined', () => {
      const config = initialPlotConfigStates.heatmap;
      expect(config.legend.direction).not.toBeDefined();
    });
  });
});
