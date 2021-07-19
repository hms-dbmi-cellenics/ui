import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourScaling = (props) => {
  const { onUpdate, config } = props;
  const onChange = (e) => {
    onUpdate({ colour: { truncatedValues: e.target.value } });
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Color Scaling</strong></p>
        <Form.Item>
          <Radio.Group onChange={onChange} value={config.colour.truncatedValues}>
            <Radio value>Capped</Radio>
            <Radio value={false}>Uncapped</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourScaling.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ColourScaling;
