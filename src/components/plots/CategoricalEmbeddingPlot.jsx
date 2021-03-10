import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import Loader from '../Loader';

const CategoricalEmbeddingPlot = (props) => {
  const {
    experimentId, config, actions, data,
  } = props;
  const dispatch = useDispatch();

  const defaultEmbeddingType = 'umap';

  const cellSets = useSelector((state) => state.cellSets);

  const embeddingSettings = useSelector((state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings);
  const { data: embeddingData, loading, error } = useSelector((state) => state.embeddings[embeddingSettings.method]) || {};

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId, defaultEmbeddingType));
    }

    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingData) {
      dispatch(loadEmbedding(experimentId, embeddingSettings.method));
    }
  }, [experimentId, embeddingSettings.method]);

  useEffect(() => {
    if (data) {
      setPlotSpec(generateSpec(config, data));
      return;
    }

    if (!cellSets.loading && !cellSets.error && embeddingData?.length) {
      setPlotSpec(generateSpec(config, generateData(cellSets, config.selectedCellSet, embeddingData)));
    }
  }, [config, data, cellSets, embeddingData, config]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings.method)); }}
        />
      );
    }

    if (cellSets.loading || !embeddingData || loading || !config) {
      return (
        <center>
          <Loader experimentId={experimentId} />
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

CategoricalEmbeddingPlot.defaultProps = {
  actions: true,
  data: null,
};

CategoricalEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  actions: PropTypes.bool,
  data: PropTypes.array,
};

export default CategoricalEmbeddingPlot;
