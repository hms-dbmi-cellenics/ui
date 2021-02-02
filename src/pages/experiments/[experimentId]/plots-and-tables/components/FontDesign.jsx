import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio, Space,
} from 'antd';

const FontDesign = (props) => {
  const { font, onUpdate } = props;

  const options = {
    'sans-serif': 'Sans-serif',
    sans: 'Sans',
    monospace: 'Monospace',
  };

  return (
    <Form size='small'>
      <Form.Item>
        <Space direction='vertical' style={{ width: '80%' }}>
          <p><strong>Font Styles</strong></p>
          <Radio.Group onChange={(e) => onUpdate(e)} value={font}>

            {
              Object.entries(options).map(([val, text]) => (
                <Radio value={val}>{text}</Radio>
              ))
            }
          </Radio.Group>
        </Space>
      </Form.Item>
    </Form>
  );
};

FontDesign.propTypes = {
  font: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
};

FontDesign.defaultProps = {
  font: 'sans-serif',
};

export default FontDesign;
