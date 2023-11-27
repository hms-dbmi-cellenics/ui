import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import PlotLayout from 'components/data-processing/PlotLayout';
import BasicFilterPlot from 'components/plots/BasicFilterPlot';
import generateKneePlotSpec from 'utils/plotSpecs/generateCellSizeDistributionKneePlot';
import generateHistogramSpec from 'utils/plotSpecs/generateCellSizeDistributionHistogram';
import CalculationConfig from './CalculationConfig';

const HIGHEST_UMI_DEFAULT = 17000;
const filterName = 'cellSizeDistribution';

const CellSizeDistribution = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => {
  const [highestUmi, setHighestUmi] = useState(null);
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 3);

  const histogramPlotData = useSelector(
    (state) => state.componentConfig[
      generateDataProcessingPlotUuid(sampleId, filterName, 1)]?.plotData,
  );

  useEffect(() => {
    setHighestUmi(_.maxBy(histogramPlotData,
      (datum) => datum.u)?.u ?? HIGHEST_UMI_DEFAULT);
  }, [histogramPlotData]);

  const plots = {
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 0),
      plotType: 'cellSizeDistributionKneePlot',
      plot: (config, plotData, actions) => (
        <BasicFilterPlot
          spec={generateKneePlotSpec(config, plotData)}
          actions={actions}
          miniPlot={config.miniPlot}
        />
      ),
    },
    histogram: {
      title: 'Histogram',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: 'cellSizeDistributionHistogram',
      plot: (config, plotData, actions) => (
        <BasicFilterPlot
          spec={generateHistogramSpec(config, plotData, highestUmi)}
          actions={actions}
          miniPlot={config.miniPlot}
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

  const renderCalculationConfig = () => <CalculationConfig highestUmi={highestUmi} />;
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
