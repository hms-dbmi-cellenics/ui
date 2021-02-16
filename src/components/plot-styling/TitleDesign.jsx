import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Input, Space,
} from 'antd';

const TitleDesign = (props) => {
  const { onUpdate, config } = props;
  const onUpdateThrottled = useCallback(_.throttle((obj) => onUpdate(obj), 500), []);
  const [newConfig, setNewConfig] = useState(config);
  const handleChange = (object) => {
    const change = _.cloneDeep(newConfig);
    _.merge(change, object);
    setNewConfig(change);
    onUpdateThrottled(object);
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
            value={newConfig.title.text}
            onChange={(e) => {
              handleChange({ title: { text: e.target.value } });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Title Font Size'
        >
          <Slider
            value={newConfig.title.fontSize}
            min={15}
            max={40}
            onChange={(value) => {
              handleChange({ title: { fontSize: value } });
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
