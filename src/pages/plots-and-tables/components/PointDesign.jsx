import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Space,
} from 'antd';

const PointDesign = (props) => {
  const { onUpdate, config } = props;

  const [radioval, setradioval] = useState(config.pointStyle);

  const onChange = (e) => {
    setradioval(e.target.value);
    onUpdate({ pointStyle: e.target.value });
  };

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
            defaultValue={config.pointSize}
            min={1}
            max={100}
            onAfterChange={(value) => {
              onUpdate({ pointSize: value });
            }}
            marks={{ 1: 1, 100: 100 }}
          />
        </Form.Item>
        <Form.Item
          label='Point Fill Opacity'
        >
          <Slider
            defaultValue={config.pointOpa}
            min={1}
            max={10}
            onAfterChange={(value) => {
              onUpdate({ pointOpa: value });
            }}
            marks={{ 1: 1, 10: 10 }}
          />
        </Form.Item>
        <div>Point Shape</div>
        <Form.Item>
          <Radio.Group onChange={onChange} value={radioval}>
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
