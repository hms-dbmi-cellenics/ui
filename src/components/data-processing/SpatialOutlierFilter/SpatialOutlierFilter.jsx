import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { imagelessTechs } from 'utils/constants';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import PlotLayout from 'components/data-processing/PlotLayout';
import BasicFilterPlot from 'components/plots/BasicFilterPlot';
import SpatialOutlierFilterPlot from 'components/plots/SpatialOutlierFilterPlot';
import generateZscoreHistogram from 'utils/plotSpecs/generateZscoreHistogram';
import CalculationConfig from './CalculationConfig';

/**
 * Shared implementation for the three Visium HD spatial local-outlier filters.
 * Each filter differs only in its config key, outlier direction, plot types and
 * titles — passed in by the thin wrapper components.
 */
const SpatialOutlierFilter = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
    filterName, direction, mainPlotType, outlierPlotType, histogramPlotType,
    mainPlotTitle, histogramTitle,
  } = props;

  // imageless techs (e.g. Xenium) render no tissue image, so the showImage
  // toggle would control nothing — drop the panel for those technologies
  const technology = useSelector((state) => state.samples?.[sampleId]?.type);
  const isImageless = imagelessTechs.includes(technology);

  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 2);

  // The metric and outlier views share the same per-cell plotData (index 0), but
  // have independent plot CONFIG (separate plotUuid/plotType) so styling one slide
  // — e.g. inverting the background — doesn't affect the other. The outlier view's
  // config (index 3) lives under its own uuid but reads the index-0 plotData via
  // `dataPlotUuid`.
  const slidePlotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const outlierPlotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 3);

  const plots = {
    metricPlot: {
      title: mainPlotTitle,
      plotUuid: slidePlotUuid,
      plotType: mainPlotType,
      plot: (config, plotData, actions, onZoomChange) => (
        <SpatialOutlierFilterPlot
          experimentId={experimentId}
          sampleId={sampleId}
          config={config}
          plotData={plotData}
          cacheId={`${filterName}-metric`}
          mode='metric'
          threshold={config.cutoff}
          direction={direction}
          actions={actions}
          onZoomChange={onZoomChange}
        />
      ),
    },
    outlierPlot: {
      title: 'Outliers',
      plotUuid: outlierPlotUuid,
      dataPlotUuid: slidePlotUuid,
      plotType: outlierPlotType,
      plot: (config, plotData, actions, onZoomChange) => (
        <SpatialOutlierFilterPlot
          experimentId={experimentId}
          sampleId={sampleId}
          config={config}
          plotData={plotData}
          cacheId={`${filterName}-outlier`}
          mode='outlier'
          threshold={config.cutoff}
          direction={direction}
          actions={actions}
          onZoomChange={onZoomChange}
        />
      ),
    },
    zscoreHistogram: {
      title: histogramTitle,
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: histogramPlotType,
      plot: (config, plotData, actions) => (
        <BasicFilterPlot
          spec={generateZscoreHistogram(config, plotData, direction)}
          actions={actions}
          miniPlot={config.miniPlot}
        />
      ),
    },
  };

  const plotStylingControlsConfig = [
    ...(isImageless ? [] : [{
      panelTitle: 'Tissue image',
      controls: ['showImage'],
    }]),
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        { panelTitle: 'Title', controls: ['title'] },
        { panelTitle: 'Font', controls: ['font'] },
      ],
    },
    {
      panelTitle: 'Axes options',
      controls: ['axes'],
    },
    {
      panelTitle: 'Colours',
      controls: ['colourScheme', 'colourInversion', 'colourReverse'],
    },
    {
      panelTitle: 'Segmentations',
      controls: [{ name: 'markers', props: { spatial: true } }],
    },
    {
      panelTitle: 'Legend',
      controls: [{
        name: 'legend',
        props: {
          option: { positions: 'top-bottom' },
          defaultTitle: mainPlotTitle,
        },
      }],
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

SpatialOutlierFilter.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
  filterName: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(['lower', 'upper']).isRequired,
  mainPlotType: PropTypes.string.isRequired,
  outlierPlotType: PropTypes.string.isRequired,
  histogramPlotType: PropTypes.string.isRequired,
  mainPlotTitle: PropTypes.string.isRequired,
  histogramTitle: PropTypes.string.isRequired,
};

SpatialOutlierFilter.defaultProps = {
  stepDisabled: false,
};

export default SpatialOutlierFilter;
