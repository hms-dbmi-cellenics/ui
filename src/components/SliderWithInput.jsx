import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber, Space,
} from 'antd';

import _ from 'lodash';

const SliderWithInput = (props) => {
  const {
    min, max, value, onUpdate, disabled, step, containerStyle, sliderWidth,
  } = props;

  const [localValue, setLocalValue] = useState(value);

  // Single debounced update callback (400ms) instead of double throttle/debounce
  const debouncedUpdate = useCallback(
    _.debounce(onUpdate, 400),
    [onUpdate]
  );

  useEffect(() => {
    setLocalValue(parseFloat(value));
  }, [value]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  const stepToSet = step ?? max / 200;

  const handleSliderChange = (newValue) => {
    setLocalValue(newValue);
    debouncedUpdate(newValue);
  };

  return (
    <Space align='start' style={containerStyle}>
      <Slider
        value={localValue}
        min={min}
        max={max}
        onChange={handleSliderChange}
        step={stepToSet}
        disabled={disabled}
        style={{
          width: sliderWidth || 200, display: 'inline-block', margin: '0.5em',
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
          debouncedUpdate(changedValueWithinBounds);
        }}
        onPressEnter={() => { onUpdate(localValue); }}
        onStep={(newValue) => {
          onUpdate(newValue);
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
  containerStyle: PropTypes.object,
  sliderWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

SliderWithInput.defaultProps = {
  disabled: false,
  step: null,
  containerStyle: {},
  sliderWidth: 200,
};

export default SliderWithInput;
