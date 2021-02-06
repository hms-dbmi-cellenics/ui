import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import { Vega } from 'react-vega';

import PlatformError from '../../../../../../components/PlatformError';
import { generateSpec, generateData } from '../../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from '../../../../../../redux/actions/embedding';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../../../../../redux/actions/experimentSettings';

const CategoricalEmbeddingPlot = (props) => {
  const { experimentId, config, plotUuid } = props;
  const dispatch = useDispatch();

  const defaultEmbeddingType = 'umap';

  const cellSets = useSelector((state) => state.cellSets);
  const processingSettings = useSelector((state) => state.experimentSettings.processing);
  const embeddingType = processingSettings?.configureEmbedding?.embeddingSettings?.method;
  const { data: embeddingData, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (!Object.getOwnPropertyDescriptor(processingSettings, 'configureEmbedding')) {
      dispatch(loadProcessingSettings(experimentId, defaultEmbeddingType));
    }

    if (cellSets.loading) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingData) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, [experimentId, embeddingType]);

  useEffect(() => {
    if (!cellSets.loading && !cellSets.error && embeddingData) {
      setPlotSpec(generateData(generateSpec(config), cellSets, config.selectedCellSet, embeddingData));
    }
  }, [cellSets, embeddingData, config]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingType)); }}
        />
      );
    }

    if (cellSets.loading || !embeddingData || loading) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
      </center>
    );
  };

  return (
    <>
      { render()}
    </>
  );
};

CategoricalEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.object.isRequired,
};

export default CategoricalEmbeddingPlot;
