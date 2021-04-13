import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
} from 'antd';

import useUpdateThrottled from '../../../utils/customHooks/useUpdateThrottled';

const BandwidthOrBinstep = (props) => {
  const {
    onUpdate, config, type, max, min, disabled,
  } = props;

  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);
  const realMin = min ?? max / 4;

  const step = max / 200;

  if (type === 'bin step') {
    return (
      <Form.Item label='Bin step'>
        <Slider
          value={newConfig.binStep}
          min={realMin}
          max={max}
          onChange={(value) => { handleChange({ binStep: value }); }}
          step={step}
          disabled={disabled}
        />
      </Form.Item>
    );
  }
  if (type === 'blank') {
    return (null);
  }
  return (
    <Form.Item label='Bandwidth'>
      <Slider
        value={newConfig.bandwidth}
        min={-1}
        max={max}
        onChange={(value) => handleChange({ bandwidth: value })}
        step={1}
        disabled={disabled}
      />
    </Form.Item>
  );
};

BandwidthOrBinstep.defaultProps = {
  max: 100,
  min: null,
};

BandwidthOrBinstep.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
  disabled: PropTypes.bool,
};
BandwidthOrBinstep.defaultProps = {
  disabled: false,
};
export default BandwidthOrBinstep;
