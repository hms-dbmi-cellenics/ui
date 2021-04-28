import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber,
} from 'antd';

import useUpdateThrottled from '../utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, value, propertyToUpdate, onUpdate, disabled, step,
  } = props;

  const [newValue, handleChange] = useUpdateThrottled(onUpdate, value);

  const stepToSet = step ?? max / 200;

  return (
    <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
      <Slider
        value={newValue}
        min={min}
        max={max}
        onChange={(changedValue) => handleChange(changedValue)}
        step={stepToSet}
        disabled={disabled}
        style={{ minWidth: 100, display: 'inline-block', flexGrow: 100 }}
      />

      <InputNumber
        value={newValue}
        min={min}
        max={max}
        onChange={(changedValue) => {
          const changedValueWithinBounds = Math.min(Math.max(changedValue, min), max);
          handleChange(changedValueWithinBounds);
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
  value: PropTypes.number.isRequired,
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
