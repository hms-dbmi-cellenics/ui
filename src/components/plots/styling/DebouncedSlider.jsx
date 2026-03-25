import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Slider } from 'antd';

/**
 * DebouncedSlider - Slider with immediate local visual feedback and debounced parent updates
 * 
 * Provides smooth slider interaction while debouncing expensive parent re-renders
 * @param {function} onUpdate - Callback fired after debounce delay (400ms default)
 * @param {number} value - Current value from parent
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 400)
 * @param {object} sliderProps - Additional props to pass to Slider component
 */
const DebouncedSlider = ({
  onUpdate, value, debounceMs = 400, path, ...sliderProps
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Create stable debounced function with cleanup
  const debouncedOnUpdate = useMemo(() => {
    return _.debounce(onUpdate, debounceMs);
  }, [onUpdate, debounceMs]);

  useEffect(() => {
    return () => {
      debouncedOnUpdate.cancel();
    };
  }, [debouncedOnUpdate]);

  // Sync local value with parent when parent changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
  };

  const handleAfterChange = (newValue) => {
    // Update parent after slider release
    if (path) {
      const update = {};
      const keys = path.split('.');
      let obj = update;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = newValue;
      debouncedOnUpdate(update);
    } else {
      debouncedOnUpdate(newValue);
    }
  };

  return (
    <Slider
      value={localValue}
      onChange={handleChange}
      onAfterChange={handleAfterChange}
      {...sliderProps}
    />
  );
};

DebouncedSlider.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
  debounceMs: PropTypes.number,
  path: PropTypes.string,
};

DebouncedSlider.defaultProps = {
  debounceMs: 400,
  path: null,
};

export default DebouncedSlider;
