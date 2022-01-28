import { plotNames } from 'utils/constants';

const plotCsvFilename = (experimentName, plotType, extras) => {
  const cleanExperimentName = experimentName.replace(/ /g, '_');
  const cleanPlotName = plotNames[plotType].replace(/ /g, '_').toLowerCase();
  const extrasClean = extras.join('-').replace(/ /g, '_');

  return `${cleanExperimentName}-${cleanPlotName}-${extrasClean}`;
};

export default plotCsvFilename;
