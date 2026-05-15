import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio, Space } from 'antd';
import DebouncedSlider from './DebouncedSlider';
import DebouncedInput from './DebouncedInput';

const TitleDesign = (props) => {
  const {
    onUpdate, config, allowTitleChange, placeHolder,
  } = props;
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
              <DebouncedInput
                placeholder={placeHolder}
                value={config.title.text}
                path='title.text'
                onUpdate={onUpdate}
              />
            </Form.Item>
          )}
        <Form.Item
          label='Title Font Size'
        >
          <DebouncedSlider
            value={config.title.fontSize}
            min={15}
            max={40}
            path='title.fontSize'
            onUpdate={onUpdate}
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
