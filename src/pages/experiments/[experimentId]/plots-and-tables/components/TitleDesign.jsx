import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Input, Space,
} from 'antd';

const TitleDesign = (props) => {
  const { onUpdate, config } = props;

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
            value={config.title.text}
            onChange={(e) => {
              onUpdate({ title: { text: e.target.value } });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Title Font Size'
        >
          <Slider
            value={config.title.fontSize}
            min={15}
            max={40}
            onChange={(value) => {
              onUpdate({ title: { fontSize: value } });
            }}
            marks={{ 15: 15, 40: 40 }}
          />
        </Form.Item>
        <Form.Item
          label='Title Location'
        >
          <Radio.Group
            onChange={(e) => onUpdate({ title: { anchor: e.target.value } })}
            value={config.title.anchor}
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
