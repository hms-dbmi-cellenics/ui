import React from 'react';
import PropTypes from 'prop-types';
import { Radio, Form, Space } from 'antd';

const LegendEditor = (props) => {
  const { onUpdate, legendEnabled, legendPosition } = props;

  const toggleChange = (e) => {
    if (e.target.value === true) {
      onUpdate({ legendEnabled: true });
    } else {
      onUpdate({ legendEnabled: false });
    }
  };
  const changePosition = (value) => {
    console.log('Position is changed ', value.target.value);
    onUpdate({ legendPosition: value.target.value });
  };

  return (
    <Form
      size='small'
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 12 }}
    >
      <Form.Item>
        <Radio.Group onChange={toggleChange} value={legendEnabled}>
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Form.Item>

    </Form>

  );
};

LegendEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  legendEnabled: PropTypes.array.isRequired,
  legendPosition: PropTypes.array.isRequired,
};

export default LegendEditor;
