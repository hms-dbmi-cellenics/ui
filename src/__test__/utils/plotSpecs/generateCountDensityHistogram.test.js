import generateCountDensityHistogram, { getCountDensityThreshold } from 'utils/plotSpecs/generateCountDensityHistogram';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const baseConfig = (nmads = 3) => ({
  ...initialPlotConfigStates.spatialCountDensityHistogram,
  nmads,
});

const plotData = {
  values: [{ value: -1 }, { value: 1 }, { value: 2 }],
  median: 1,
  mad: 0.5,
};

const binned = (spec) => spec.data.find(({ name }) => name === 'binned');
const ruleXs = (spec) => spec.marks
  .filter(({ type }) => type === 'rule')
  .map((mark) => mark.encode.update.x.value);

describe('getCountDensityThreshold', () => {
  it('is the median minus nmads MADs', () => {
    expect(getCountDensityThreshold({ median: 1, mad: 0.5 }, 3)).toBe(-0.5);
    expect(getCountDensityThreshold({ median: 1, mad: 0.5 }, 0)).toBe(1);
  });

  it('defaults to 3 MADs and is null without stats', () => {
    expect(getCountDensityThreshold({ median: 1, mad: 0.5 })).toBe(-0.5);
    expect(getCountDensityThreshold(undefined, 3)).toBeNull();
  });
});

describe('generateCountDensityHistogram', () => {
  it('bins the log densities with a rule at the threshold', () => {
    const spec = generateCountDensityHistogram(baseConfig(), plotData);

    expect(spec.data.find(({ name }) => name === 'plotData').values).toEqual(plotData.values);
    expect(ruleXs(spec)).toEqual([-0.5]);
    expect(binned(spec).transform.find(({ as }) => as === 'status').expr)
      .toBe("(datum.bin1 <= -0.5) ? 'outlier' : 'kept'");
  });

  it('moves the threshold with nmads and keeps it in view', () => {
    const spec = generateCountDensityHistogram(baseConfig(10), plotData);

    expect(ruleXs(spec)).toEqual([-4]);
    expect(binned(spec).transform.find(({ type }) => type === 'bin').extent).toEqual([-4, 2]);
  });

  it('draws no rule without stats', () => {
    const spec = generateCountDensityHistogram(baseConfig(), { values: plotData.values });

    expect(ruleXs(spec)).toEqual([]);
  });
});
