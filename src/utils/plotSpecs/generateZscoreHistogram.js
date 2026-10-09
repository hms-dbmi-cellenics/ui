import buildThresholdHistogramSpec from 'utils/plotSpecs/buildThresholdHistogramSpec';

// Histogram of spatial local-outlier z-scores for a data-processing filter.
// Bars beyond the cutoff (per direction) are coloured as outliers and a dashed
// rule marks the threshold. Mirrors generateDoubletScoreHistogram.
//
// @param {object} config   merged plot + filter config (reads cutoff, binStep, axes…)
// @param {Array}  plotData array of { zscore } records
// @param {string} direction 'lower' | 'upper' — which tail is removed
const generateSpec = (config, plotData, direction = 'lower') => {
  const cutoff = config.cutoff ?? 3;

  // z-scores are unbounded and can be negative — derive the domain from the data.
  let minZ = -cutoff * 2;
  let maxZ = cutoff * 2;
  if (plotData?.length) {
    minZ = Infinity;
    maxZ = -Infinity;
    plotData.forEach(({ zscore }) => {
      if (zscore < minZ) minZ = zscore;
      if (zscore > maxZ) maxZ = zscore;
    });
    // make sure the cutoff rule is always visible within the domain
    minZ = Math.min(minZ, -cutoff);
    maxZ = Math.max(maxZ, cutoff);
  }
  const extent = [minZ, maxZ];

  const statusExpr = direction === 'upper'
    ? `(datum.bin1 > ${cutoff}) ? 'outlier' : 'kept'`
    : `(datum.bin0 < ${-cutoff}) ? 'outlier' : 'kept'`;

  const ruleValue = direction === 'upper' ? cutoff : -cutoff;

  return buildThresholdHistogramSpec(config, plotData, {
    field: 'zscore',
    extent,
    statusExpr,
    ruleValues: [ruleValue],
  });
};

export default generateSpec;
