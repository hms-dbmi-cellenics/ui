import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Input } from 'antd';

/**
 * DebouncedInput - Text input with immediate local visual feedback and debounced parent updates
 * 
 * Provides smooth typing experience while debouncing expensive parent re-renders
 * @param {function} onUpdate - Callback fired after debounce delay (800ms default)
 * @param {string} value - Current value from parent
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 800)
 * @param {string} path - Dot-notation path for nested updates (e.g. "title.text")
 * @param {object} inputProps - Additional props to pass to Input component
 */
const DebouncedInput = ({
  onUpdate, value, debounceMs = 800, path, ...inputProps
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

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Build nested object if path is provided
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

  const handlePressEnter = () => {
    // Immediately flush the debounced update on Enter
    debouncedOnUpdate.flush();
  };

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onPressEnter={handlePressEnter}
      {...inputProps}
    />
  );
};

DebouncedInput.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  debounceMs: PropTypes.number,
  path: PropTypes.string,
};

DebouncedInput.defaultProps = {
  debounceMs: 800,
  path: null,
};

export default DebouncedInput;
