import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio, Space,
} from 'antd';
import DebouncedSlider from './DebouncedSlider';

const PointDesign = (props) => {
  const {
    onUpdate, config, showShapeType, spatial,
  } = props;

  // For spatial plots the marks are segmentation polygons, not points: hide the
  // point size/shape controls and relabel the remaining ones accordingly.
  const styleHeader = spatial ? 'Segmentation Style' : 'Point Style';

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 6, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 18 }}
      >
        <p><strong>{`${styleHeader}:`}</strong></p>
        {
          !spatial
          && (
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
          )
        }

        {
          config.marker.showOpacity
          && (
            <Form.Item
              label={'Opacity'}
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
          showShapeType && !spatial
          && (
            <>
              <p><strong>Point Shape:</strong></p>
              <Form.Item>
                <Radio.Group
                  onChange={(e) => onUpdate({ marker: { shape: e.target.value } })}
                  value={config.marker.shape}
                >
                  <Radio value='circle'>Circle</Radio>
                  <Radio value='diamond'>Diamond</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )
        }
        {
          (showShapeType || spatial)
          && (
            <>
              <p><strong>Toggle Outline:</strong></p>
              <Form.Item>
                <Radio.Group
                  onChange={(e) => onUpdate({ marker: { outline: e.target.value } })}
                  value={config.marker.outline}
                >
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
  spatial: PropTypes.bool,
};

PointDesign.defaultProps = {
  showShapeType: true,
  spatial: false,
};

export default PointDesign;
