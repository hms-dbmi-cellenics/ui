import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';

import SliderWithInput from '../../SliderWithInput';

// Shared settings for the spatial local-outlier filters: a single z-score cutoff
// (plus a histogram bin step). Direction is fixed per filter, not user-editable.
const SpatialOutlierCalculationConfig = (props) => {
  const { config, disabled, updateSettings } = props;

  return (
    <>
      <Form.Item label='Z-score threshold'>
        <SliderWithInput
          min={0}
          max={10}
          step={0.5}
          value={config.cutoff}
          onUpdate={(newValue) => updateSettings({ cutoff: newValue })}
          disabled={disabled}
        />
      </Form.Item>
      <Form.Item label='Bin step'>
        <SliderWithInput
          min={0.05}
          max={1}
          step={0.05}
          value={config.binStep}
          onUpdate={(newValue) => updateSettings({ binStep: newValue })}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
};

SpatialOutlierCalculationConfig.defaultProps = {
  updateSettings: () => {},
  config: {},
  disabled: false,
};

SpatialOutlierCalculationConfig.propTypes = {
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  disabled: PropTypes.bool,
};

export default SpatialOutlierCalculationConfig;
