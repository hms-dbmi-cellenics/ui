import React from 'react';
import PropTypes from 'prop-types';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import PlotLayout from 'components/data-processing/PlotLayout';
import generateSpec from 'utils/plotSpecs/generateDoubletScoreHistogram';
import BasicFilterPlot
from 'components/plots/BasicFilterPlot';
import CalculationConfig from './CalculationConfig';

const DoubletScores = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => {
  const filterName = 'doubletScores';
  const plotType = 'doubletScoreHistogram';
  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 1);

  const plots = {
    doubletScoreHistogram: {
      plotUuid,
      plot: (config, plotData, actions) => (
        <BasicFilterPlot
          spec={generateSpec(config, plotData)}
          actions={actions}
        />
      ),
      plotType,
    },
  };

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

DoubletScores.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

DoubletScores.defaultProps = {
  stepDisabled: false,
};

export default DoubletScores;
