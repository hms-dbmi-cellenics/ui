import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio, Space,
} from 'antd';
import DebouncedSlider from './DebouncedSlider';

const PointDesign = (props) => {
  const { onUpdate, config, showShapeType } = props;

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Point Style:</strong></p>
        <Form.Item
          label='Point Size'
        >
          <DebouncedSlider
            value={config.marker.size}
            min={1}
            max={100}
            path='marker.size'
            onUpdate={onUpdate}
            marks={{ 1: 1, 100: 100 }}
          />
        </Form.Item>

        {
          config.marker.showOpacity
          && (
            <Form.Item
              label='Point Fill Opacity'
            >
              <DebouncedSlider
                value={config.marker.opacity}
                min={1}
                max={10}
                path='marker.opacity'
                onUpdate={onUpdate}
                marks={{ 1: 1, 10: 10 }}
              />
            </Form.Item>
          )
        }
        {
          showShapeType
          && (
            <>
              <p><strong>Point Shape:</strong></p>
              <Form.Item>
                <Radio.Group onChange={(e) => onUpdate({ marker: { shape: e.target.value } })} value={config.marker.shape}>
                  <Radio value='circle'>Circle</Radio>
                  <Radio value='diamond'>Diamond</Radio>
                </Radio.Group>
              </Form.Item>
              <p><strong>Toggle Outline:</strong></p>
              <Form.Item>
                <Radio.Group onChange={(e) => onUpdate({ marker: { outline: e.target.value } })} value={config.marker.outline}>
                  <Radio value>Show</Radio>
                  <Radio value={false}>Hide</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )
        }
      </Form>
    </Space>
  );
};

PointDesign.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  showShapeType: PropTypes.bool,
};

PointDesign.defaultProps = {
  showShapeType: true,
};

export default PointDesign;
