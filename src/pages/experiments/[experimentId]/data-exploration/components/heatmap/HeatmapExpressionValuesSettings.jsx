import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Radio } from 'antd';
import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';

const HeatmapExpressionValuesSettings = () => {
  const dispatch = useDispatch();
  const expressionValue = useSelector((state) => state.componentConfig.interactiveHeatmap.config.expressionValue);

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
          updatePlotConfig('interactiveHeatmap', {
            expressionValue: target.value,
          }),
        )}
      >
        {Object.keys(expressionValues).map((type) => (
          <Radio style={radioStyle} value={type}>
            {expressionValues[type]}
          </Radio>
        ))}
      </Radio.Group>
    </div>
  );
};

export default HeatmapExpressionValuesSettings;
