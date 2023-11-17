import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import PlotLayout from 'components/data-processing/PlotLayout';
import CellSizeDistributionHistogram from '../../plots/CellSizeDistributionHistogram';
import CellSizeDistributionKneePlot from '../../plots/CellSizeDistributionKneePlot';
import CalculationConfig from './CalculationConfig';

const HIGHEST_UMI_DEFAULT = 17000;
const filterName = 'cellSizeDistribution';

const CellSizeDistribution = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => {
  const [selectedPlot, setSelectedPlot] = useState('kneePlot');
  const highestUmiRef = useRef(null);

  const histogramPlotData = useSelector(
    (state) => state.componentConfig[
      generateDataProcessingPlotUuid(sampleId, filterName, 1)]?.plotData,
  );

  useEffect(() => {
    highestUmiRef.current = _.maxBy(histogramPlotData,
      (datum) => datum.u)?.u ?? HIGHEST_UMI_DEFAULT;
  }, [histogramPlotData]);

  const plots = {
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 0),
      plotType: 'cellSizeDistributionKneePlot',
      plot: (config, plotData, actions) => (
        <CellSizeDistributionKneePlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    histogram: {
      title: 'Histogram',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: 'cellSizeDistributionHistogram',
      plot: (config, plotData, actions) => (
        <CellSizeDistributionHistogram
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
          highestUmi={highestUmiRef.current}
        />
      ),
    },
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
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
    }];

  const renderCalculationConfig = () => <CalculationConfig highestUmi={highestUmiRef.current} />;

  return (
    <PlotLayout
      experimentId={experimentId}
      plots={plots}
      selectedPlot={selectedPlot}
      setSelectedPlot={setSelectedPlot}
      filterName={filterName}
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

CellSizeDistribution.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

CellSizeDistribution.defaultProps = {
  stepDisabled: false,
};

export default CellSizeDistribution;
