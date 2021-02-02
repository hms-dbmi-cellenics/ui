import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourbarDesign = (props) => {
  const { onUpdate, value } = props;

  const options = {
    viridis: 'Viridis',
    inferno: 'Inferno',
    spectral: 'Spectral',
    redblue: 'Red-Blue',
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Color Schemes</strong></p>
        <Form.Item>
          <Radio.Group onChange={(e) => onUpdate(e)} value={value}>
            {
              Object.entries(options).map(([val, text]) => (
                <Radio value={val}>{text}</Radio>
              ))
            }
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourbarDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.string,
};

ColourbarDesign.defaultProps = {
  value: 'viridis',
};

export default ColourbarDesign;
