import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const DotPlotSizeScale = (props) => {
  const {
    onUpdate, config,
  } = props;

  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  const minSize = 5;
  const maxSize = 40;
  const marks = {};
  marks[minSize] = minSize;
  marks[maxSize] = maxSize;

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <p><strong>Size Scale:</strong></p>
      <Form
        size='small'
        labelCol={{ span: 10, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 12 }}
      >
        <Form.Item
          label='Max Point Size'
        >
          <Slider
            value={newConfig.maxPointSize || 20}
            min={minSize}
            max={maxSize}
            onChange={(value) => {
              handleChange({ maxPointSize: value });
            }}
            marks={marks}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

DotPlotSizeScale.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default DotPlotSizeScale;
