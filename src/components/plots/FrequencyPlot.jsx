import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import loadCellSets from '../../redux/actions/cellSets/loadCellSets';

import { generateSpec, generateData } from '../../utils/plotSpecs/generateFrequencySpec';

const FrequencyPlot = (props) => {
  const {
    experimentId, config,
  } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);

  const {
    hierarchy, properties,
  } = cellSets;

  useEffect(() => {
    if (!hierarchy && !properties) {
      dispatch(loadCellSets(experimentId));
    }
  }, [experimentId]);

  const spec = generateSpec(config, generateData(hierarchy, properties, config));

  return (
    <center>
      <Vega spec={spec} renderer='canvas' />
    </center>
  );
};

FrequencyPlot.propTypes = {
  config: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
};

export default FrequencyPlot;
