import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import loadCellSets from '../../redux/actions/cellSets/loadCellSets';

import { generateSpec, generateData } from '../../utils/plotSpecs/generateFrequencySpec';

const FrequencyPlot = (props) => {
  const {
    experimentId, config, actions,
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
      <Vega spec={spec} renderer='canvas' actions={actions} />
    </center>
  );
};

FrequencyPlot.propTypes = {
  config: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

FrequencyPlot.defaultProps = {
  actions: true,
};

export default React.memo(FrequencyPlot);
