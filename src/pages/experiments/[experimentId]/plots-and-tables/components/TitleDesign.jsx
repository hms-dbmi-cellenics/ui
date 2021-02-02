import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Slider, Form,
  Radio, Input, Space,
} from 'antd';

const TitleDesign = (props) => {
  const {
    title,
    fontSize,
    anchor,
    onTitleUpdate,
    onFontSizeUpdate,
    onAnchorUpdate,
  } = props;

  const onFontSizeUpdateThrottled = useRef(_.throttle((val) => onFontSizeUpdate(val), 10));

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Title Styles</strong></p>
        <Form.Item
          label='Define Title'
        >
          <Input
            placeholder='Enter title'
            value={title}
            onChange={(e) => onTitleUpdate(e)}
          />
        </Form.Item>
        <Form.Item
          label='Title Font Size'
        >
          <Slider
            value={fontSize}
            min={15}
            max={40}
            onChange={(val) => onFontSizeUpdateThrottled.current(val)}
            marks={{ 15: 15, 40: 40 }}
          />
        </Form.Item>
        <Form.Item
          label='Title Location'
        >
          <Radio.Group
            onChange={(e) => onAnchorUpdate(e)}
            value={anchor}
          >
            <Radio value='start'>Left</Radio>
            <Radio value='middle'>Center</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Space>
  );
};

TitleDesign.propTypes = {
  title: PropTypes.string,
  fontSize: PropTypes.number,
  anchor: PropTypes.string,
  onTitleUpdate: PropTypes.func.isRequired,
  onFontSizeUpdate: PropTypes.func.isRequired,
  onAnchorUpdate: PropTypes.func.isRequired,
};

TitleDesign.defaultProps = {
  title: '',
  fontSize: 20,
  anchor: 'start',
};

export default TitleDesign;
