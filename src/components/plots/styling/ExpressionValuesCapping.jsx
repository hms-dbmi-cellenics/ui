import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ExpressionValuesCapping = (props) => {
  const { onUpdate, config } = props;

  const { expressionValue, truncatedValues } = config;

  const onChange = (e) => {
    onUpdate({ truncatedValues: e.target.value });
  };

  const showingZScore = expressionValue === 'zScore';

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Capping:</strong></p>
        <Form.Item>
          <Radio.Group onChange={onChange} value={!showingZScore && truncatedValues}>
            <Radio disabled={showingZScore} value>Capped</Radio>
            <Radio value={false}>Uncapped</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ExpressionValuesCapping.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ExpressionValuesCapping;
