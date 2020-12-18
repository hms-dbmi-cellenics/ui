import React from 'react';
import PropTypes from 'prop-types';
import { Radio, Form } from 'antd';

const LegendEditor = (props) => {
  const {
    onUpdate, legendEnabled, legendPosition, legendOptions,
  } = props;

  const onChange = (e) => {
    onUpdate({ legendEnabled: e.target.value });
  };
  const changePosition = (value) => {
    onUpdate({ legendPosition: value.target.value });
  };
  let position = null;
  if (legendOptions === 'top-bot') {
    position = (
      <>
        <div> Position</div>
        <Form.Item>
          <Radio.Group
            onChange={(value) => changePosition(value)}
            value={legendPosition}
          >
            <Radio value='top'>Top</Radio>
            <Radio value='bottom'>Bottom</Radio>
          </Radio.Group>
        </Form.Item>
      </>
    );
  }
  if (legendOptions === 'corners') {
    position = (
      <>
        <div>Position</div>
        <Form.Item>
          <Radio.Group
            onChange={(value) => changePosition(value)}
            value={legendPosition}
          >
            <Radio value='top-left'>Top-Left</Radio>
            <Radio value='top-right'>Top-Right</Radio>
            <Radio value='bottom-left'>Bot-Left</Radio>
            <Radio value='bottom-right'>Bot-Right</Radio>
          </Radio.Group>
        </Form.Item>
      </>
    );
  }
  return (
    <Form size='small' labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
      <Form.Item>
        <Radio.Group onChange={onChange} value={legendEnabled}>
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Form.Item>
      {position}
    </Form>
  );
};

LegendEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  legendEnabled: PropTypes.bool.isRequired,
  legendPosition: PropTypes.string.isRequired,
  legendOptions: PropTypes.array.isRequired,
};

export default LegendEditor;
