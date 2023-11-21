import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import PlotLayout from 'components/data-processing/PlotLayout';
import ClassifierEmptyDropsPlot from '../../plots/ClassifierEmptyDropsPlot';
import ClassifierKneePlot from '../../plots/ClassifierKneePlot';
import CalculationConfig from './CalculationConfig';

const filterName = 'classifier';

const Classifier = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => {
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 2);

  const plots = {
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: 'classifierKneePlot',
      plot: (config, plotData, actions) => (
        <ClassifierKneePlot
          config={config}
          expConfig={expConfig}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    emptyDropsPlot: {
      title: 'Empty Drops Plot',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 0),
      plotType: 'classifierEmptyDropsPlot',
      plot: (config, plotData, actions) => (
        <ClassifierEmptyDropsPlot
          config={config}
          expConfig={expConfig}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
  };

  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Plot Dimensions',
      controls: ['dimensions'],
    },
    {
      panelTitle: 'Axes',
      controls: ['axesWithRanges'],
    },
    {
      panelTitle: 'Title',
      controls: ['title'],
    },
    {
      panelTitle: 'Font',
      controls: ['font'],
    },
  ];

  const renderCalculationConfig = () => <CalculationConfig />;

  return (
    <PlotLayout
      experimentId={experimentId}
      plots={plots}
      filterName={filterName}
      filterTableUuid={filterTableUuid}
      sampleId={sampleId}
      sampleIds={sampleIds}
      onConfigChange={onConfigChange}
      stepDisabled={stepDisabled}
      plotStylingControlsConfig={plotStylingControlsConfig}
      renderCalculationConfig={renderCalculationConfig}
      stepHadErrors={stepHadErrors}
    />
  );
};

Classifier.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

Classifier.defaultProps = {
  stepDisabled: false,
};

export default Classifier;
