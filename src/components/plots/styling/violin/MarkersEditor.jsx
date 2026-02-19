import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Radio, Slider, Space,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const MarkersEditor = (props) => {
  const { onUpdate, config } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

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
          <Slider
            value={newConfig.marker.size}
            min={1}
            max={100}
            onChange={(value) => {
              handleChange({ marker: { size: value } });
            }}
            marks={{ 1: 1, 100: 100 }}
          />
        </Form.Item>
        <Form.Item
          label='Point Fill Opacity'
        >
          <Slider
            value={newConfig.marker.opacity}
            min={1}
            max={10}
            onChange={(value) => {
              handleChange({ marker: { opacity: value } });
            }}
            marks={{ 1: 1, 10: 10 }}
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
