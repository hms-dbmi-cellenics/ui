import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
} from 'antd';

const BandwidthOrBinstep = (props) => {
  const { onUpdate, config, type } = props;
  if (type === 'bin step') {
    return (
      <Form.Item label='Bin step:'>
        <Slider
          defaultValue={config.binStep}
          min={0.001}
          max={0.2}
          onAfterChange={(value) => onUpdate({ binStep: value })}
          step={0.001}
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
        defaultValue={config.bandwidth}
        min={-1}
        max={100}
        onAfterChange={(value) => onUpdate({ bandwidth: value })}
        step={1}
      />
    </Form.Item>
  );
};

BandwidthOrBinstep.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  type: PropTypes.object.isRequired,
};

export default BandwidthOrBinstep;
