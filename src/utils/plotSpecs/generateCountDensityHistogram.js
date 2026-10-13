import buildThresholdHistogramSpec from 'utils/plotSpecs/buildThresholdHistogramSpec';

// The log count-density threshold of the Xenium count-density filter: the
// sample's median minus nmads MADs, as computed by the pipeline.
const getCountDensityThreshold = (stats, nmads) => {
  if (!Number.isFinite(stats?.median) || !Number.isFinite(stats?.mad)) return null;
  return stats.median - (nmads ?? 3) * stats.mad;
};

// Histogram of log(counts / um^2) for the Xenium count-density filter, with a
// dashed rule at the threshold. Bins fully below it are outliers.
//
// @param {object} config   merged plot + filter config (reads nmads, binStep, axes…)
// @param {object} plotData { values: [{ value }], median, mad }
const generateSpec = (config, plotData) => {
  const values = plotData?.values ?? [];
  const threshold = getCountDensityThreshold(plotData, config.nmads);

  let extent = [-2, 2];
  if (values.length) {
    extent = [Infinity, -Infinity];
    values.forEach(({ value }) => {
      if (value < extent[0]) extent[0] = value;
      if (value > extent[1]) extent[1] = value;
    });
  }
  if (threshold !== null) {
    extent = [Math.min(extent[0], threshold), Math.max(extent[1], threshold)];
  }
  // vega cannot bin a zero-width extent
  if (extent[0] === extent[1]) extent[1] += 1;

  return buildThresholdHistogramSpec(config, values, {
    field: 'value',
    extent,
    statusExpr: threshold === null
      ? "'kept'"
      : `(datum.bin1 <= ${threshold}) ? 'outlier' : 'kept'`,
    ruleValues: threshold === null ? [] : [threshold],
  });
};

export default generateSpec;
export { getCountDensityThreshold };
