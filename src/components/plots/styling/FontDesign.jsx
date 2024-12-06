import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio, Space,
} from 'antd';

const FontDesign = (props) => {
  const { onUpdate, config } = props;

  return (
    <Form size='small'>
      <Form.Item>
        <Space direction='vertical' style={{ width: '80%' }}>
          <p><strong>Font Styles:</strong></p>
          <Radio.Group onChange={(e) => onUpdate({ fontStyle: { font: e.target.value } })} value={config.fontStyle.font}>
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
