import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
} from 'antd';

const BandwidthOrBinstep = (props) => {
  const {
    onUpdate, config, type, max, min,
  } = props;
  let minDefault = min ?? 0.001;
  const maxDefault = max ?? 0.2;

  if (!min) {
    minDefault = maxDefault / 4;
  }

  const step = maxDefault / 200;

  if (type === 'bin step') {
    return (
      <Form.Item label='Bin step:'>
        <Slider
          value={config.binStep}
          min={minDefault}
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
  min: 25,
};

BandwidthOrBinstep.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
};

export default BandwidthOrBinstep;
