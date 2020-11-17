import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Space,
} from 'antd';

const PointDesign = (props) => {
  const { onUpdate, config } = props;

  const onChange = (e) => {
    onUpdate({ pointStyle: e.target.value });
  };
  const onUpdateThrottled = useRef(_.throttle((obj) => onUpdate(obj), 10));

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Point Style</div>
        <Form.Item
          label='Point Size'
        >
          <Slider
            value={config.pointSize}
            min={1}
            max={100}
            onChange={(value) => {
              onUpdateThrottled.current({ pointSize: value });
            }}
            marks={{ 1: 1, 100: 100 }}
          />
        </Form.Item>
        <Form.Item
          label='Point Fill Opacity'
        >
          <Slider
            value={config.pointOpa}
            min={1}
            max={10}
            onChange={(value) => {
              onUpdateThrottled.current({ pointOpa: value });
            }}
            marks={{ 1: 1, 10: 10 }}
          />
        </Form.Item>
        <div>Point Shape</div>
        <Form.Item>
          <Radio.Group onChange={onChange} value={config.pointStyle}>
            <Radio value='circle'>Circle</Radio>
            <Radio value='diamond'>Diamond</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Space>
  );
};

PointDesign.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default PointDesign;
