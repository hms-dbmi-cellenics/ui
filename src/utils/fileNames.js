
import { plotNames } from 'utils/constants';

const plotCsvFilename = (experimentName, plotType, extras) => {

const cleanExperimentName = experimentName.replace(/ /g, '_');
const cleanPlotName = plotNames[plotType].replace(/ /g, '_').toLowerCase();
const extras = extras.join('-').replace(/ /g, '_');

return `${clearnExperimentName}-${cleanPlotName}-${extras}`;
}

// eslint-disable-next-line import/prefer-default-export
export plotCsvFilename;
