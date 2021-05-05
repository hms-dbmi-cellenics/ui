import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio, Slider } from 'antd';

const MarkersEditor = (props) => {
  const { onUpdate, config } = props;

  return (
    <Form
      size='small'
      labelCol={{ span: 14 }}
      wrapperCol={{ span: 18 }}
    >
      <Form.Item
        label='Cell markers'
      >
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
          value={config.marker.size}
          min={1}
          max={100}
          onChange={(value) => {
            onUpdate({ marker: { size: value } });
          }}
          marks={{ 1: 1, 100: 100 }}
        />
      </Form.Item>
      <Form.Item
        label='Median and Interquartile range'
      >
        <Radio.Group
          onChange={(e) => onUpdate({ statisticsVisible: e.target.value === 'show' })}
          value={config.statisticsVisible ? 'show' : 'hide'}
        >
          <Radio value='show'>Show</Radio>
          <Radio value='hide'>Hide</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

MarkersEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default MarkersEditor;
