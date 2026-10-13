import buildThresholdHistogramSpec from 'utils/plotSpecs/buildThresholdHistogramSpec';

// Histogram of a raw spatial QC metric for the absolute-threshold method, with
// dashed rules at the min/max thresholds. UMIs and genes span orders of
// magnitude, so they are binned on log10 (binStep is then in log10 units);
// mitochondrial percent is binned linearly.
//
// @param {object} config   merged plot + filter config (reads min, max, binStep, axes…)
// @param {Array}  plotData array of { raw } records
// @param {object} options  { logScale, xAxisTitle }
const generateSpec = (config, plotData, { logScale = true, xAxisTitle } = {}) => {
  const toPlotScale = (x) => (logScale ? Math.log10(x) : x);
  const isSet = (bound) => bound !== null && bound !== undefined;

  const values = [];
  (plotData || []).forEach(({ raw }) => {
    if (raw === null || raw === undefined) return;
    const value = toPlotScale(raw);
    if (Number.isFinite(value)) values.push({ value });
  });

  const min = isSet(config.min) ? toPlotScale(config.min) : null;
  const max = isSet(config.max) ? toPlotScale(config.max) : null;
  const ruleValues = [min, max].filter((x) => x !== null && Number.isFinite(x));

  // derive the domain from the data, widened so the threshold rules stay visible
  let extent = logScale ? [0, 5] : [0, 100];
  if (values.length) {
    extent = [Infinity, -Infinity];
    values.forEach(({ value }) => {
      if (value < extent[0]) extent[0] = value;
      if (value > extent[1]) extent[1] = value;
    });
  }
  extent = [Math.min(extent[0], ...ruleValues), Math.max(extent[1], ...ruleValues)];
  // vega cannot bin a zero-width extent
  if (extent[0] === extent[1]) extent[1] += 1;

  // a bin is an outlier when all of it lies outside the inclusive [min, max]
  const outlierConditions = [];
  if (min !== null) outlierConditions.push(`datum.bin1 <= ${min}`);
  if (max !== null) outlierConditions.push(`datum.bin0 > ${max}`);
  const statusExpr = outlierConditions.length
    ? `(${outlierConditions.join(' || ')}) ? 'outlier' : 'kept'`
    : "'kept'";

  return buildThresholdHistogramSpec(config, values, {
    field: 'value',
    extent,
    statusExpr,
    ruleValues,
    xAxisTitle,
  });
};

export default generateSpec;
