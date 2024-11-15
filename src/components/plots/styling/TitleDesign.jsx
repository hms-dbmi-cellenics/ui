import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Input, Space,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const TitleDesign = (props) => {
  const {
    onUpdate, config, allowTitleChange, placeHolder,
  } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);
  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 10, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 14 }}
      >
        <p><strong>Title Styles:</strong></p>
        {allowTitleChange
          && (
            <Form.Item
              label='Title Text'
            >
              <Input
                placeholder={placeHolder}
                value={newConfig.title.text}
                onChange={(e) => {
                  handleChange({ title: { text: e.target.value } });
                }}
              />
            </Form.Item>
          )}
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
  allowTitleChange: PropTypes.bool,
  placeHolder: PropTypes.string,
};
TitleDesign.defaultProps = {
  allowTitleChange: true,
  placeHolder: 'Enter title',
};

export default TitleDesign;
