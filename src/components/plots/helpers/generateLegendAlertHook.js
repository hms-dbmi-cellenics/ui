import _ from 'lodash';
import { MAX_LEGEND_ITEMS } from './PlotLegendAlert';

const generateLegendAlertHook = (hierarchy, plotCellSetKey) => {
  const hookFn = (plotConfig) => {
    const numLegendItems = hierarchy.find(
      ({ key }) => key === plotConfig[plotCellSetKey],
    )?.children?.length;

    if (numLegendItems <= MAX_LEGEND_ITEMS) return;

    const modifiedConfig = _.merge(plotConfig, {
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
