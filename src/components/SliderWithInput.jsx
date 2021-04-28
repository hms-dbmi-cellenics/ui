import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber,
} from 'antd';

import useUpdateThrottled from '../utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, config, propertyToUpdate, onUpdate, disabled, step,
  } = props;

  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  const stepToSet = step ?? max / 200;

  return (
    <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
      <Slider
        value={newConfig[propertyToUpdate]}
        min={min}
        max={max}
        onChange={(value) => handleChange({ [propertyToUpdate]: value })}
        step={stepToSet}
        disabled={disabled}
        style={{ minWidth: 100, display: 'inline-block', flexGrow: 100 }}
      />

      <InputNumber
        value={newConfig[propertyToUpdate]}
        min={min}
        max={max}
        onChange={(value) => {
          const valueWithinBounds = Math.min(Math.max(value, min), max);
          handleChange({ [propertyToUpdate]: valueWithinBounds });
        }}
        step={stepToSet}
        disabled={disabled}
        style={{ width: 80, display: 'inline-block' }}
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
  disabled: PropTypes.bool,
  step: PropTypes.number,
};

SliderWithInput.defaultProps = {
  disabled: false,
  step: null,
};

export default SliderWithInput;
