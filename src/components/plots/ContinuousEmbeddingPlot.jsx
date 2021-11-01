import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { fastLoad } from '../Loader';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import { getCellSets } from '../../redux/selectors';

const ContinuousEmbeddingPlot = (props) => {
  const {
    experimentId, config, plotUuid,
    plotData, truncatedPlotData,
    actions, loading, error, reloadPlotData, onUpdate,
  } = props;
  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );
  const { method } = embeddingSettings || false;

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings?.method]) || {};

  const cellSets = useSelector(getCellSets());

  const [plotSpec, setPlotSpec] = useState({});
  const plotComponent = useSelector(
    (state) => state.componentConfig[plotUuid],
  );

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [experimentId, embeddingSettings?.method]);
  useEffect(() => {
    if (!config) return;
    const { defaultValues: axesDefaultValues, xAxisText, yAxisText } = config?.axes;

    if (embeddingSettings?.method && axesDefaultValues?.length) {
      const methodUppercase = method[0].toUpperCase() + method.slice(1);
      if (axesDefaultValues.includes('x') && !xAxisText.includes(methodUppercase)) {
        onUpdate({ axes: { xAxisText: `${methodUppercase} 1` } });
      }
      if (axesDefaultValues.includes('y') && !yAxisText.includes(methodUppercase)) {
        onUpdate({ axes: { yAxisText: `${methodUppercase} 2` } });
      }
    }
  }, [config, embeddingSettings?.method]);

  useEffect(() => {
    if (!embeddingLoading
      && !embeddingError
      && config
      && plotData?.length > 0
      && !cellSets.loading
      && !cellSets.error
      && embeddingData?.length) {
      setPlotSpec(
        generateSpec(
          config,
          generateData(
            cellSets,
            config.selectedSample,
            config.truncatedValues ? truncatedPlotData : plotData,
            embeddingData,
          ),
        ),
      );
    }
  }, [config, plotData, embeddingData, cellSets, embeddingLoading]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => {
            reloadPlotData();
          }}
        />
      );
    }

    if (loading || embeddingLoading || !plotComponent) {
      return (
        <center>
          {fastLoad()}
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' actions={actions} />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

ContinuousEmbeddingPlot.defaultProps = {
  plotData: null,
  actions: true,
};

ContinuousEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  truncatedPlotData: PropTypes.array,
  plotUuid: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  reloadPlotData: PropTypes.func,
  onUpdate: PropTypes.func.isRequired,
};

ContinuousEmbeddingPlot.defaultProps = {
  reloadPlotData: () => { },
  truncatedPlotData: null,
};

export default ContinuousEmbeddingPlot;
