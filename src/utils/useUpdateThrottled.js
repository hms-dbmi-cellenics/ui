import _ from 'lodash';
import { useState, useCallback } from 'react';

// A custom hook for the sliders in plot styling for throttling the dispatching of updates to redux

const useUpdateThrottled = (onUpdate, config) => {
  const updateThrottled = useCallback(_.throttle((obj) => onUpdate(obj), 1000), []);
  const [newConfig, setNewConfig] = useState(config);

  const handleChange = (updatedField) => {
    const changes = _.cloneDeep(newConfig);
    _.merge(changes, updatedField);
    setNewConfig(changes);
    updateThrottled(updatedField);
  };
  return { newConfig, handleChange };
};

export default useUpdateThrottled;
