import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Space,
} from 'antd';

const PointDesign = (props) => {
  const {
    shape, size, opacity,
    onShapeUpdate,
    onSizeUpdate,
    onOpacityUpdate,
  } = props;

  const onThrottledSizeUpdate = useRef(_.throttle((val) => onSizeUpdate(val), 10));
  const onThrottledOpacityUpdate = useRef(_.throttle((val) => onOpacityUpdate(val), 10));

  const options = {
    circle: 'Circle',
    diamond: 'Diamond',
  };

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >

        <p><strong>Point Shape</strong></p>
        <Form.Item>
          <Radio.Group
            onChange={(e) => onShapeUpdate(e)}
            value={shape}
          >
            {
              Object.entries(options).map(([val, text]) => (
                <Radio key={val} value={val}>{text}</Radio>
              ))
            }
          </Radio.Group>
        </Form.Item>

        <p><strong>Point Size</strong></p>
        <Form.Item
          label='Point Size'
        >
          <Slider
            value={size}
            min={1}
            max={100}
            onChange={(val) => onThrottledSizeUpdate.current(val)}
            marks={{ 1: 1, 100: 100 }}
          />
        </Form.Item>

        <p><strong>Point Fill Opacity</strong></p>
        <Form.Item
          label='Point Fill Opacity'
        >
          <Slider
            value={opacity}
            min={1}
            max={10}
            onChange={(val) => onThrottledOpacityUpdate.current(val)}
            marks={{ 1: 1, 10: 10 }}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

PointDesign.propTypes = {
  shape: PropTypes.string,
  size: PropTypes.string,
  opacity: PropTypes.string,
  onShapeUpdate: PropTypes.func.isRequired,
  onSizeUpdate: PropTypes.func.isRequired,
  onOpacityUpdate: PropTypes.string.isRequired,
};

PointDesign.defaultProps = {
  shape: 'circle',
  size: 5,
  opacity: 5,
};

export default PointDesign;
