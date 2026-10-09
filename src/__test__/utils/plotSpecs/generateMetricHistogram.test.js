import generateMetricHistogram from 'utils/plotSpecs/generateMetricHistogram';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const baseConfig = (bounds = {}) => ({
  ...initialPlotConfigStates.spatialUmiOutlierZscoreHistogram,
  binStep: 0.05,
  ...bounds,
});

const makePlotData = (raws) => raws.map((raw) => ({ raw }));

const binned = (spec) => spec.data.find(({ name }) => name === 'binned');
const statusExpr = (spec) => binned(spec).transform.find(({ as }) => as === 'status').expr;
const ruleXs = (spec) => spec.marks
  .filter(({ type }) => type === 'rule')
  .map((mark) => mark.encode.update.x.value);

describe('generateMetricHistogram', () => {
  it('bins log10 of the raw values for UMIs and genes', () => {
    const spec = generateMetricHistogram(baseConfig(), makePlotData([10, 100, 1000]));

    const { values } = spec.data.find(({ name }) => name === 'plotData');
    expect(values.map(({ value }) => value)).toEqual([1, 2, 3]);
    expect(binned(spec).transform.find(({ type }) => type === 'bin').field).toBe('value');
  });

  it('drops values that have no finite log, e.g. zero', () => {
    const spec = generateMetricHistogram(baseConfig(), makePlotData([0, 100, null]));

    const { values } = spec.data.find(({ name }) => name === 'plotData');
    expect(values).toEqual([{ value: 2 }]);
  });

  it('draws rules at min and max and flags bins fully outside them', () => {
    const spec = generateMetricHistogram(
      baseConfig({ min: 100, max: 10000 }), makePlotData([10, 1000, 100000]),
    );

    expect(ruleXs(spec)).toEqual([2, 4]);
    expect(statusExpr(spec)).toBe("(datum.bin1 <= 2 || datum.bin0 > 4) ? 'outlier' : 'kept'");
  });

  it('has no max rule when max is null', () => {
    const spec = generateMetricHistogram(
      baseConfig({ min: 100, max: null }), makePlotData([10, 1000]),
    );

    expect(ruleXs(spec)).toEqual([2]);
    expect(statusExpr(spec)).toBe("(datum.bin1 <= 2) ? 'outlier' : 'kept'");
  });

  it('keeps every bin when no bound is set', () => {
    const spec = generateMetricHistogram(baseConfig(), makePlotData([10, 1000]));

    expect(ruleXs(spec)).toEqual([]);
    expect(statusExpr(spec)).toBe("'kept'");
  });

  it('bins mitochondrial percent linearly with a max rule only', () => {
    const spec = generateMetricHistogram(
      baseConfig({ max: 25 }), makePlotData([1, 10, 50]), { logScale: false, xAxisTitle: 'Mito %' },
    );

    expect(ruleXs(spec)).toEqual([25]);
    expect(binned(spec).transform.find(({ type }) => type === 'bin').extent).toEqual([1, 50]);
    expect(spec.axes[0].title).toBe('Mito %');
  });

  it('widens the extent so the rules stay visible', () => {
    const spec = generateMetricHistogram(
      baseConfig({ min: 10, max: 1e6 }), makePlotData([100, 1000]),
    );

    expect(binned(spec).transform.find(({ type }) => type === 'bin').extent).toEqual([1, 6]);
  });
});
