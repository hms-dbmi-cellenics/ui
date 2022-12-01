import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber, Space,
} from 'antd';

import _ from 'lodash';

import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, value, onUpdate, disabled, step,
  } = props;

  const [, handleChange] = useUpdateThrottled(onUpdate, value);

  const [localValue, setLocalValue] = useState(value);

  const debouncedOnChange = useCallback(
    _.debounce((changedValue) => handleChange(changedValue), 1000), [],
  );

  useEffect(() => {
    setLocalValue(parseFloat(value));
  }, [value]);

  const stepToSet = step ?? max / 200;

  return (
    <Space align='start'>
      <Slider
        value={localValue}
        min={min}
        max={max}
        onChange={setLocalValue}
        onAfterChange={() => handleChange(localValue)}
        step={stepToSet}
        disabled={disabled}
        style={{
          minWidth: 100, display: 'inline-block', flexGrow: 100, margin: '0.5em',
        }}
      />

      <InputNumber
        value={localValue}
        min={min}
        max={max}
        onChange={(changedValue) => {
          if (changedValue === value) { return; }

          const changedValueWithinBounds = Math.min(Math.max(changedValue, min), max);

          setLocalValue(changedValueWithinBounds);

          debouncedOnChange(changedValueWithinBounds);
        }}
        onPressEnter={() => { handleChange(localValue); }}
        onStep={(newValue) => {
          handleChange(newValue);
        }}
        step={stepToSet}
        disabled={disabled}
        style={{ width: 80, display: 'inline-block' }}
      />
    </Space>
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
