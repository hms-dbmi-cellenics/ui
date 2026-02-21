import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Space,
} from 'antd';
import SliderWithInput from 'components/SliderWithInput';

const DisplayLabels = (props) => {
  const {
    config, onUpdate, min, max,
  } = props;

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <p><strong>Adjusted P-value Threshold</strong></p>

      <Form.Item
        labelCol={{ span: 5, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 19 }}
      >
        <SliderWithInput
          data-testid='thresholdInput'
          value={config.textThresholdValue}
          min={min}
          max={max}
          onUpdate={(value) => {
            onUpdate({ textThresholdValue: value });
          }}
          sliderWidth={200}
        />
      </Form.Item>
    </Space>
  );
};

DisplayLabels.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default DisplayLabels;
