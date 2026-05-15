import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Radio, Space,
} from 'antd';
import DebouncedSlider from 'components/plots/styling/DebouncedSlider';

const MarkersEditor = (props) => {
  const { onUpdate, config } = props;

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Form
        size='small'
        labelCol={{ span: 12, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Toggle Markers:</strong></p>
        <Form.Item>
          <Radio.Group
            onChange={(e) => onUpdate({ selectedPointsVisible: e.target.value === 'show' })}
            value={config.selectedPointsVisible ? 'show' : 'hide'}
          >
            <Radio value='show'>Show</Radio>
            <Radio value='hide'>Hide</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label='Point Size'
        >
          <DebouncedSlider
            value={config.marker.size}
            min={1}
            max={100}
            marks={{ 1: 1, 100: 100 }}
            path='marker.size'
            onUpdate={onUpdate}
          />
        </Form.Item>
        <Form.Item
          label='Point Fill Opacity'
        >
          <DebouncedSlider
            value={config.marker.opacity}
            min={1}
            max={10}
            marks={{ 1: 1, 10: 10 }}
            path='marker.opacity'
            onUpdate={onUpdate}
          />
        </Form.Item>
        <p><strong>Toggle Median & Interquartile Range:</strong></p>
        <Form.Item>
          <Radio.Group
            onChange={(e) => onUpdate({ statisticsVisible: e.target.value === 'show' })}
            value={config.statisticsVisible ? 'show' : 'hide'}
          >
            <Radio value='show'>Show</Radio>
            <Radio value='hide'>Hide</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Space>
  );
};

MarkersEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default MarkersEditor;
