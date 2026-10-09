import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { imagelessTechs } from 'utils/constants';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import PlotLayout from 'components/data-processing/PlotLayout';
import BasicFilterPlot from 'components/plots/BasicFilterPlot';
import SpatialOutlierFilterPlot from 'components/plots/SpatialOutlierFilterPlot';
import generateZscoreHistogram from 'utils/plotSpecs/generateZscoreHistogram';
import generateMetricHistogram from 'utils/plotSpecs/generateMetricHistogram';
import CalculationConfig, { ABSOLUTE_THRESHOLD, LOCAL_OUTLIER } from './CalculationConfig';

// [min, max] of the raw metric across a sample's cells, for the threshold slider
const getRawRange = (plotData) => {
  if (!plotData?.length) return null;
  let low = Infinity;
  let high = -Infinity;
  plotData.forEach(({ raw }) => {
    if (raw === undefined || raw === null) return;
    if (raw < low) low = raw;
    if (raw > high) high = raw;
  });
  return Number.isFinite(low) ? [low, high] : null;
};

/**
 * Shared implementation for the spatial QC metric filters (UMIs, genes, mito).
 * Each filter differs only in its config key, outlier direction, plot types and
 * titles — passed in by the thin wrapper components. Each can filter by spatial
 * local outlier (z-score) or by an absolute threshold on the raw metric.
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

  const method = useSelector(
    (state) => state.experimentSettings.processing[filterName]?.[sampleId]
      ?.filterSettings?.method,
  ) ?? LOCAL_OUTLIER;
  const isAbsolute = method === ABSOLUTE_THRESHOLD;

  // The metric and outlier views share the same per-cell plotData (index 0), but
  // have independent plot CONFIG (separate plotUuid/plotType) so styling one slide
  // — e.g. inverting the background — doesn't affect the other. The outlier view's
  // config (index 3) lives under its own uuid but reads the index-0 plotData via
  // `dataPlotUuid`.
  const slidePlotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const outlierPlotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 3);

  const slidePlotData = useSelector((state) => state.componentConfig[slidePlotUuid]?.plotData);
  const rawRange = useMemo(() => getRawRange(slidePlotData), [slidePlotData]);

  // the merged config holds the active method's settings (see PlotLayout);
  // mito (upper) only has a max
  const getBounds = (config) => ({
    min: direction === 'lower' ? config.min ?? null : null,
    max: config.max ?? null,
  });

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
          method={method}
          threshold={config.cutoff}
          direction={direction}
          min={getBounds(config).min}
          max={getBounds(config).max}
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
          method={method}
          threshold={config.cutoff}
          direction={direction}
          min={getBounds(config).min}
          max={getBounds(config).max}
          actions={actions}
          onZoomChange={onZoomChange}
        />
      ),
    },
    zscoreHistogram: {
      title: isAbsolute ? `${mainPlotTitle} distribution` : histogramTitle,
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: histogramPlotType,
      plot: (config, plotData, actions) => (
        <BasicFilterPlot
          spec={isAbsolute
            ? generateMetricHistogram(config, plotData, {
              logScale: direction === 'lower',
              xAxisTitle: direction === 'lower' ? `log10(${mainPlotTitle})` : mainPlotTitle,
            })
            : generateZscoreHistogram(config, plotData, direction)}
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

  const renderCalculationConfig = () => (
    <CalculationConfig
      direction={direction}
      metricLabel={mainPlotTitle}
      rawRange={rawRange}
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
