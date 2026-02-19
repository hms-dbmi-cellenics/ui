import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';

import { generateSpec, generateData } from 'utils/plotSpecs/generateViolinSpec';

import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';

const ViolinPlotMain = (props) => {
  const {
    experimentId, plotUuid,
  } = props;
  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const expression = useSelector((state) => state.genes.expression.full);
  const cellSets = useSelector(getCellSets());

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  ).length;

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (config
      && !expression.error
      && expression.matrix.geneIsLoaded(config.shownGene)
      && cellSets.accessible) {
      const geneExpressionData = config.normalised === 'zScore'
        ? expression.matrix.getZScore(config.shownGene)
        : expression.matrix.getRawExpression(config.shownGene);

      if (selectedCellSetClassAvailable) {
        const generatedPlotData = generateData(
          cellSets,
          geneExpressionData,
          config?.selectedCellSet,
          config?.selectedPoints,
        );
        setPlotSpec(generateSpec(config, generatedPlotData));
      }
    }
  }, [experimentId, config, expression, cellSets]);

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          reason={cellSets.error}
          onClick={() => {
            dispatch(loadCellSets(experimentId));
          }}
        />
      );
    }

    if (
      !config?.shownGene
      || expression.loading.includes(config?.shownGene)
      || !cellSets.accessible
    ) {
      return <Loader experimentId={experimentId} />;
    }

    if (!selectedCellSetClassAvailable) {
      return (
        <PlatformError
          description='No clustering available.'
          reason='Set up your clustering in the configure embedding step in Data Processing to view this plot, or select different data.'
          actionable={false}
        />
      );
    }

    if (expression.error && !expression.matrix.geneIsLoaded(config.shownGene)) {
      return (
        <PlatformError
          error={expression.error}
          reason={expression.error}
          onClick={() => {
            dispatch(loadGeneExpression(
              experimentId, [config?.shownGene], plotUuid,
            ));
          }}
        />
      );
    }

    return <Vega spec={plotSpec} renderer='webgl' />;
  };

  return render();
};

ViolinPlotMain.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default ViolinPlotMain;
