import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { loadGeneExpression } from 'redux/actions/genes';
import ContinuousEmbeddingPlot from './ContinuousEmbeddingPlot';

// wrapper component used in plots and tables
// where the data for the embedding needs to be derived from redux
// on change rerendering the component
const ContinuousEmbeddingReduxWrapper = (props) => {
  const {
    experimentId, actions, plotUuid,
  } = props;
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const geneExpression = useSelector((state) => state.genes.expression.full);

  return (
    <ContinuousEmbeddingPlot
      experimentId={experimentId}
      config={config}
      plotData={geneExpression.matrix.getRawExpression(config?.shownGene)}
      truncatedPlotData={geneExpression.matrix.getTruncatedExpression(config?.shownGene)}
      actions={actions}
      loading={geneExpression.loading.length > 0}
      error={geneExpression.error}
      reloadPlotData={() => dispatch(loadGeneExpression(
        experimentId, [config?.shownGene], plotUuid,
      ))}
    />
  );
};
ContinuousEmbeddingReduxWrapper.defaultProps = {
  actions: true,
};
ContinuousEmbeddingReduxWrapper.propTypes = {
  experimentId: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  plotUuid: PropTypes.string.isRequired,
};
export default ContinuousEmbeddingReduxWrapper;
