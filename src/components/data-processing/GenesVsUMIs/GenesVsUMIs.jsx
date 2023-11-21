import React from 'react';
import PropTypes from 'prop-types';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import { useSelector } from 'react-redux';

import PlotLayout from 'components/data-processing/PlotLayout';
import FeaturesVsUMIsScatterplot from 'components/plots/FeaturesVsUMIsScatterplot'; // Adjust the import path as necessary
import CalculationConfig from './CalculationConfig';

const GenesVsUMIs = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors, onQCRunClick,
}) => {
  const filterName = 'numGenesVsNumUmis';
  const plotType = 'featuresVsUMIsScatterplot';
  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 1);
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );
  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: true,
    editor: false,
  };
  const plotData = useSelector(
    (state) => state.componentConfig[plotUuid]?.plotData,
  );
  const plots = {
    featuresVsUMIsScatterplot: {
      plotUuid,
      plot: (config, data, actions) => (
        <FeaturesVsUMIsScatterplot
          config={config}
          plotData={data}
          actions={actions}
          expConfig={expConfig}

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

  const renderCalculationConfig = () => (
    <CalculationConfig
      rerunRequired={plotData?.linesData && !plotData?.linesData[0]?.length}
      onQCRunClick={onQCRunClick}
    />

  );

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
      allowedPlotActions={allowedPlotActions}
    />
  );
};

GenesVsUMIs.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
  onQCRunClick: PropTypes.func.isRequired,
};

GenesVsUMIs.defaultProps = {
  stepDisabled: false,
};

export default GenesVsUMIs;
