import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import hash from 'object-hash';

import EmptyPlot from './helpers/EmptyPlot';
import generateSpec from '../../utils/plotSpecs/generateFeaturesVsUMIsScatterplot';

const FeaturesVsUMIsScatterplot = (props) => {
  const {
    config, plotData, actions,
  } = props;

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    if (config && plotData?.length) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [config, plotData]);

  const render = () => {
    if (!plotData?.length) {
      return (
        <EmptyPlot mini={config.miniPlot} />
      );
    }

    return (
      <center data-testid='vega-container'>
        <Vega spec={plotSpec} renderer='canvas' actions={actions} />
      </center>
    );
  };

  return (
    <>
      { render()}
    </>
  );
};

FeaturesVsUMIsScatterplot.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

FeaturesVsUMIsScatterplot.defaultProps = {
  plotData: null,
  actions: true,
};

export default React.memo(
  FeaturesVsUMIsScatterplot,
  (prevProps, nextProps) => hash(prevProps) === hash(nextProps),
);
