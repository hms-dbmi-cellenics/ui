import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber,
} from 'antd';

import useUpdateThrottled from '../utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, value, onUpdate, disabled, step,
  } = props;

  const [, handleChange] = useUpdateThrottled(onUpdate, value);

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const stepToSet = step ?? max / 200;

  return (
    <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
      <Slider
        value={localValue}
        min={min}
        max={max}
        onChange={setLocalValue}
        onAfterChange={() => handleChange(localValue)}
        step={stepToSet}
        disabled={disabled}
        style={{ minWidth: 100, display: 'inline-block', flexGrow: 100 }}
      />

      <InputNumber
        value={localValue}
        min={min}
        max={max}
        onChange={(changedValue) => {
          const changedValueWithinBounds = Math.min(Math.max(changedValue, min), max);
          setLocalValue(changedValueWithinBounds);
        }}
        onPressEnter={() => { handleChange(localValue); }}
        onStep={() => { handleChange(localValue); }}
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
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  step: PropTypes.number,
};

SliderWithInput.defaultProps = {
  disabled: false,
  step: null,
};

export default SliderWithInput;
