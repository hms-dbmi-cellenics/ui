import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
} from 'antd';

const BandwidthOrBinstep = (props) => {
  const {
    onUpdate, config, type, max,
  } = props;
  let min = 0.001;
  let maxDefault = 0.2;
  if (max) {
    min = max / 4;
    maxDefault = max;
  }
  const step = maxDefault / 200;

  if (type === 'bin step') {
    return (
      <Form.Item label='Bin step:'>
        <Slider
          value={config.binStep}
          min={min}
          max={maxDefault}
          onChange={(value) => { onUpdate({ binStep: value }); }}
          step={step}
        />
      </Form.Item>
    );
  }
  if (type === 'blank') {
    return (null);
  }
  return (
    <Form.Item label='Bandwidth:'>
      <Slider
        value={config.bandwidth}
        min={-1}
        max={max}
        onChange={(value) => onUpdate({ bandwidth: value })}
        step={1}
      />
    </Form.Item>
  );
};

BandwidthOrBinstep.defaultProps = {
  max: 100,
};

BandwidthOrBinstep.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  max: PropTypes.number,
};

export default BandwidthOrBinstep;
