import _ from 'lodash';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

const generateLegendAlertHook = (hierarchy, cellSetKey, useConfigValue = true) => {
  const hookFn = (plotConfig) => {
    const cellSetName = useConfigValue ? plotConfig[cellSetKey] : cellSetKey;

    const numLegendItems = hierarchy.find(
      ({ key }) => key === cellSetName,
    )?.children?.length;

    if (numLegendItems <= MAX_LEGEND_ITEMS) return plotConfig;

    const modifiedConfig = _.merge({}, plotConfig, {
      legend: {
        enabled: false,
        showAlert: true,
      },
    });

    return modifiedConfig;
  };

  return hookFn;
};

export default generateLegendAlertHook;
