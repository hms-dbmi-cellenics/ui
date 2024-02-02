/* eslint-disable no-empty */
/* eslint-disable camelcase */
import _ from 'lodash';

const calculateVolcanoDataPoints = (config, data) => {
  const dataPoints = _.cloneDeep(data);
  dataPoints
    .filter((datum) => {
      const { logFC } = datum;
      const p_val_adj = parseFloat(datum.p_val_adj);

      // Downsample insignificant, not changing genes by the appropriate amount.
      const isSignificant = (logFC < config.logFoldChangeThreshold * -1
        || logFC > config.logFoldChangeThreshold)
        && p_val_adj < config.pvalueThreshold;

      if (isSignificant) {
        return true;
      }

      if (Math.random() > config.downsampleRatio) {
        return true;
      }

      return false;
    })
    .map((datum) => {
      // Add a status to each gene depending on where they lie in the system.
      // Note: the numbers in these names are important. In the schema, we
      // order the colors by the names, and the names are declared sorted,
      // so they must be alphabetically ordered.
      let status;
      const { logFC } = datum;
      const p_val_adj = parseFloat(datum.p_val_adj);

      const { adjPvalueThreshold } = config;

      if (
        p_val_adj <= adjPvalueThreshold
        && logFC >= config.logFoldChangeThreshold
      ) {
        status = 'Upregulated';
      } else if (
        p_val_adj <= adjPvalueThreshold
        && logFC <= config.logFoldChangeThreshold * -1
      ) {
        status = 'Downregulated';
      } else {
        status = 'No difference';
      }
      // eslint-disable-next-line no-param-reassign
      datum.status = status;

      return datum;
    });
  return dataPoints;
};

export default calculateVolcanoDataPoints;
