import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Input, Space,
} from 'antd';

const TitleDesign = (props) => {
  const { onUpdate, config } = props;

  const onChange = (e) => {
    onUpdate({ titleAnchor: e.target.value });
  };

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Title Styles</div>
        <Form.Item
          label='Define Title'
        >
          <Input
            placeholder='Enter title'
            onPressEnter={(e) => {
              onUpdate({ titleText: e.target.value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Title Font Size'
        >
          <Slider
            value={config.titleSize}
            min={15}
            max={40}
            onChange={(value) => {
              onUpdate({ titleSize: value });
            }}
            marks={{ 15: 15, 40: 40 }}
          />
        </Form.Item>
        <Form.Item
          label='Title Location'
        >
          <Radio.Group
            onChange={onChange}
            value={config.titleAnchor}
          >
            <Radio value='start'>Left</Radio>
            <Radio value='middle'>Middle</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Space>
  );
};

TitleDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default TitleDesign;
