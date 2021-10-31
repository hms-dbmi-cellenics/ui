import React, { useEffect, useState } from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import { generateSpec, generateData } from '../../utils/plotSpecs/generateFrequencySpec';

const FrequencyPlot = (props) => {
  const {
    config, actions, cellSets,
  } = props;

  const [plotSpec, setPlotSpec] = useState({});

  const {
    hierarchy, properties,
  } = cellSets;

  useEffect(() => {
    if (hierarchy && properties && config) {
      const {
        xNamesToDisplay,
        yNamesToDisplay,
        plotData,
      } = generateData(hierarchy, properties, config);

      setPlotSpec(generateSpec(config, plotData, xNamesToDisplay, yNamesToDisplay));
    }
  }, [hierarchy, properties, config]);

  return (
    <center>
      <Vega spec={plotSpec} renderer='canvas' actions={actions} />
    </center>
  );
};

FrequencyPlot.propTypes = {
  config: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  cellSets: PropTypes.object,
};

FrequencyPlot.defaultProps = {
  actions: true,
  cellSets: null,
};

export default FrequencyPlot;
