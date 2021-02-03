import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Radio } from 'antd';
import PropTypes from 'prop-types';

import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';

const HeatmapExpressionValuesSettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;

  const expressionValue = useSelector((state) => state.componentConfig[componentType].config.expressionValue);

  const expressionValues = {
    raw: 'Raw values',
    zScore: 'Z-score',
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <div style={{ padding: '5px' }}>
      <Radio.Group
        value={expressionValue}
        onChange={({ target }) => dispatch(
          updatePlotConfig(componentType, {
            expressionValue: target.value,
          }),
        )}
      >
        {Object.keys(expressionValues).map((type) => (
          <Radio style={radioStyle} value={type} key={type}>
            {expressionValues[type]}
          </Radio>
        ))}
      </Radio.Group>
    </div>
  );
};

HeatmapExpressionValuesSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapExpressionValuesSettings;
