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

  const [newLocalValue, setNewValue] = useState(value);

  useEffect(() => {
    setNewValue(value);
  }, [value]);

  const stepToSet = step ?? max / 200;

  return (
    <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
      <Slider
        value={newLocalValue}
        min={min}
        max={max}
        onChange={setNewValue}
        onAfterChange={() => handleChange(newLocalValue)}
        step={stepToSet}
        disabled={disabled}
        style={{ minWidth: 100, display: 'inline-block', flexGrow: 100 }}
      />

      <InputNumber
        value={newLocalValue}
        min={min}
        max={max}
        onChange={(changedValue) => {
          const changedValueWithinBounds = Math.min(Math.max(changedValue, min), max);
          setNewValue(changedValueWithinBounds);
        }}
        onPressEnter={() => { handleChange(newLocalValue); }}
        onStep={() => { handleChange(newLocalValue); }}
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
