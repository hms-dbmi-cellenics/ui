import generateZscoreHistogram from 'utils/plotSpecs/generateZscoreHistogram';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

// The z-score histogram config inherits doubletScoreHistogram + a cutoff of 3.
const baseConfig = () => ({
  ...initialPlotConfigStates.spatialUmiOutlierZscoreHistogram,
});

const makePlotData = (zscores) => zscores.map((zscore) => ({ zscore }));

// Find the binned dataset's status formula transform expression.
const statusExpr = (spec) => spec.data
  .find(({ name }) => name === 'binned')
  .transform.find(({ as }) => as === 'status')
  .expr;

// Find the cutoff rule mark's x value.
const ruleX = (spec) => spec.marks.find(({ type }) => type === 'rule').encode.update.x.value;

describe('generateZscoreHistogram', () => {
  it('builds a valid vega spec with a binned dataset and a rule mark', () => {
    const spec = generateZscoreHistogram(baseConfig(), makePlotData([-1, 0, 1]));

    expect(spec.$schema).toMatch(/vega\/v5/);
    expect(spec.data.map(({ name }) => name)).toEqual(['plotData', 'binned']);
    expect(spec.marks.map(({ type }) => type)).toEqual(['rect', 'rule']);

    const binTransform = spec.data
      .find(({ name }) => name === 'binned')
      .transform.find(({ type }) => type === 'bin');
    expect(binTransform.field).toBe('zscore');
  });

  it('colours kept bars green and outlier bars red via an ordinal scale', () => {
    const spec = generateZscoreHistogram(baseConfig(), makePlotData([0]));
    const colorScale = spec.scales.find(({ name }) => name === 'color');

    expect(colorScale.domain).toEqual(['kept', 'outlier']);
    expect(colorScale.range).toEqual(['#2f9e44', 'red']);
  });

  describe('cutoff rule per direction', () => {
    it('lower direction: flags bins below -cutoff and places the rule at -cutoff', () => {
      const config = { ...baseConfig(), cutoff: 3 };
      const spec = generateZscoreHistogram(config, makePlotData([0]), 'lower');

      expect(statusExpr(spec)).toBe("(datum.bin0 < -3) ? 'outlier' : 'kept'");
      expect(ruleX(spec)).toBe(-3);
    });

    it('upper direction: flags bins above +cutoff and places the rule at +cutoff', () => {
      const config = { ...baseConfig(), cutoff: 3 };
      const spec = generateZscoreHistogram(config, makePlotData([0]), 'upper');

      expect(statusExpr(spec)).toBe("(datum.bin1 > 3) ? 'outlier' : 'kept'");
      expect(ruleX(spec)).toBe(3);
    });

    it('respects a custom cutoff value', () => {
      const config = { ...baseConfig(), cutoff: 2.5 };
      const spec = generateZscoreHistogram(config, makePlotData([0]), 'upper');

      expect(statusExpr(spec)).toBe("(datum.bin1 > 2.5) ? 'outlier' : 'kept'");
      expect(ruleX(spec)).toBe(2.5);
    });

    it('defaults cutoff to 3 when omitted from the config', () => {
      const config = baseConfig();
      delete config.cutoff;
      const spec = generateZscoreHistogram(config, makePlotData([0]), 'lower');

      expect(ruleX(spec)).toBe(-3);
    });

    it('defaults to the lower direction when none is given', () => {
      const spec = generateZscoreHistogram(baseConfig(), makePlotData([0]));
      expect(statusExpr(spec)).toContain('datum.bin0 < -3');
    });
  });

  describe('z-score domain derivation', () => {
    it('derives the bin extent from the data range when data is present', () => {
      const spec = generateZscoreHistogram(baseConfig(), makePlotData([-5, 8]));
      const binTransform = spec.data
        .find(({ name }) => name === 'binned')
        .transform.find(({ type }) => type === 'bin');

      // extent spans the data; widened to include the cutoff if needed (here data
      // already exceeds ±3).
      expect(binTransform.extent).toEqual([-5, 8]);
    });

    it('always widens the extent so the cutoff rule is visible', () => {
      // Data tighter than the cutoff → extent must still reach ±cutoff.
      const spec = generateZscoreHistogram({ ...baseConfig(), cutoff: 3 }, makePlotData([-1, 1]));
      const binTransform = spec.data
        .find(({ name }) => name === 'binned')
        .transform.find(({ type }) => type === 'bin');

      expect(binTransform.extent[0]).toBeLessThanOrEqual(-3);
      expect(binTransform.extent[1]).toBeGreaterThanOrEqual(3);
    });

    it('falls back to a ±2·cutoff extent when there is no data', () => {
      const spec = generateZscoreHistogram({ ...baseConfig(), cutoff: 3 }, []);
      const binTransform = spec.data
        .find(({ name }) => name === 'binned')
        .transform.find(({ type }) => type === 'bin');

      expect(binTransform.extent).toEqual([-6, 6]);
    });
  });

  describe('axes ranges', () => {
    it('uses the data extent for the x domain when xAxisAuto is true', () => {
      const config = baseConfig();
      config.axesRanges = { ...config.axesRanges, xAxisAuto: true };
      const spec = generateZscoreHistogram(config, makePlotData([-4, 7]));
      const xScale = spec.scales.find(({ name }) => name === 'xscale');

      expect(xScale.domain).toEqual([-4, 7]);
    });

    it('uses the configured min/max for the x domain when xAxisAuto is false', () => {
      const config = baseConfig();
      config.axesRanges = {
        ...config.axesRanges, xAxisAuto: false, xMin: -10, xMax: 10,
      };
      const spec = generateZscoreHistogram(config, makePlotData([-4, 7]));
      const xScale = spec.scales.find(({ name }) => name === 'xscale');

      expect(xScale.domain).toEqual([-10, 10]);
    });
  });

  it('omits the legend when the legend is disabled', () => {
    const config = baseConfig();
    config.legend = { ...config.legend, enabled: false };
    const spec = generateZscoreHistogram(config, makePlotData([0]));

    expect(spec.legends).toBeNull();
  });

  it('renders the legend when enabled', () => {
    const config = baseConfig();
    config.legend = { ...config.legend, enabled: true, position: 'top' };
    const spec = generateZscoreHistogram(config, makePlotData([0]));

    expect(spec.legends).toHaveLength(1);
    expect(spec.legends[0].direction).toBe('horizontal');
  });
});
