import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import { Vega } from 'react-vega';

import PlatformError from '../../../../../../components/PlatformError';
import { generateSpec, generateData } from '../../../../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import { loadEmbedding } from '../../../../../../redux/actions/embedding';
import { loadGeneExpression } from '../../../../../../redux/actions/genes';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';

const ContinuousEmbeddingPlot = (props) => {
  const { experimentId, config } = props;
  const dispatch = useDispatch();

  const embeddingType = useSelector((state) => state.experimentSettings.processing.configureEmbedding?.embeddingSettings.method);
  const { data: embeddingData, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const geneExpression = useSelector((state) => state.genes.expression.data);
  const cellSetProperties = useSelector((state) => state.cellSets.properties);
  const [rawSpec, setRawSpec] = useState(false);
  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    setRawSpec(generateSpec(config));
  }, [config]);

  useEffect(() => {
    if (!embeddingData) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }

    if (!Object.keys(geneExpression).length) {
      dispatch(loadGeneExpression(experimentId, [config.shownGene]));
    }

    if (!Object.keys(cellSetProperties).length) {
      dispatch(loadCellSets(experimentId));
    }

    if (Object.keys(geneExpression).length && embeddingData && rawSpec) {
      setPlotSpec(generateData(rawSpec, geneExpression[config.shownGene], config.selectedSample, embeddingData, cellSetProperties));
    }
  }, [embeddingData, geneExpression, rawSpec]);

  const render = () => {

    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingType)) }}
        />
      )
    }

    if (!embeddingData
      || !Object.keys(geneExpression).length
      || loading) {
      return (
        <Spin size='large' />
      )
    }

    <Vega spec={plotSpec} renderer='canvas' />

  }

  return (
    <>
      { render}
  );
};

ContinuousEmbeddingPlot.propTypes = {
        experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
};

export default ContinuousEmbeddingPlot;
