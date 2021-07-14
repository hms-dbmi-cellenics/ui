import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourbarDesign = (props) => {
  const { onUpdate, config } = props;

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Colour Schemes</strong></p>
        <Form.Item>
          <Radio.Group onChange={(e) => onUpdate({ colour: { gradient: e.target.value } })} value={config.colour.gradient}>
            <Radio value='default'>Default</Radio>
            <Radio value='viridis'>Viridis</Radio>
            <Radio value='inferno'>Inferno</Radio>
            <Radio value='spectral'>Spectral</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourbarDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ColourbarDesign;
