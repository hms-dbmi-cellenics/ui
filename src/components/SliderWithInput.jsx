import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber, Space,
} from 'antd';

import useUpdateThrottled from '../utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, config, propertyToUpdate, onUpdate,
  } = props;

  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  return (
    <Space>
      <Slider
        value={newConfig[propertyToUpdate]}
        min={min}
        max={max}
        onChange={(value) => handleChange({ [propertyToUpdate]: value })}
        step={1}
        style={{ minWidth: 100 }}
      />

      <InputNumber
        value={newConfig[propertyToUpdate]}
        min={min}
        max={max}
        onChange={(value) => {
          const valueWithinBounds = Math.min(Math.max(value, min), max);
          handleChange({ [propertyToUpdate]: valueWithinBounds });
        }}
        style={{ width: 60 }}
      />
    </Space>
  );
};

SliderWithInput.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  config: PropTypes.object.isRequired,
  propertyToUpdate: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default SliderWithInput;
