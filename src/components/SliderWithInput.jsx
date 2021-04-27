import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber,
} from 'antd';

import useUpdateThrottled from '../utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, config, propertyToUpdate, onUpdate,
  } = props;

  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  return (
    <div>
      <Slider
        value={newConfig[propertyToUpdate]}
        min={min}
        max={max}
        onChange={(value) => handleChange({ [propertyToUpdate]: value })}
        step={1}
      // disabled={disabled}
      />

      <InputNumber
        value={newConfig[propertyToUpdate]}
        // step={100}
        min={min}
        max={max}
        onChange={(value) => {
          handleChange({ [propertyToUpdate]: value });
        }}
      />
    </div>
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
