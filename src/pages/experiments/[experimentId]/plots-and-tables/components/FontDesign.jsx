import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio, Space,
} from 'antd';

const FontDesign = (props) => {
  const { onUpdate, config } = props;

  const onChange = (e) => {
    onUpdate({ masterFont: e.target.value });
  };

  return (
    <Form size='small'>
      <Form.Item>
        <Space direction='vertical' style={{ width: '80%' }}>
          <div> Font Styles </div>
          <Radio.Group onChange={onChange} value={config.masterFont}>
            <Radio value='sans-serif'>Sans-serif</Radio>
            <Radio value='sans'>Sans</Radio>
            <Radio value='monospace'>Monospace</Radio>
          </Radio.Group>
        </Space>
      </Form.Item>
    </Form>
  );
};

FontDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default FontDesign;
