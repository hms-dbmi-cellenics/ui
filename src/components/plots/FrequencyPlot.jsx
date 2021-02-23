import React from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import { generateSpec } from '../../utils/plotSpecs/generateFrequencySpec';
import populateFrequencyData from './helpers/populateFrequencyData';

const FrequencyPlot = (props) => {
  const {
    hierarchy, properties, config, actions,
  } = props;

  const spec = generateSpec(config);
  populateFrequencyData(spec, hierarchy, properties, config);

  return (
    <center>
      <Vega spec={spec} renderer='canvas' actions={actions} />
    </center>
  );
};

FrequencyPlot.defaultProps = {
  actions: true,
};

FrequencyPlot.propTypes = {
  hierarchy: PropTypes.object.isRequired,
  properties: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  actions: PropTypes.object,
};

export default FrequencyPlot;
