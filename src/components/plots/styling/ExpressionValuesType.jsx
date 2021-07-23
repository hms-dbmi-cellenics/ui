import React from 'react';
import { Form, Radio } from 'antd';
import PropTypes from 'prop-types';

const ExpressionValuesType = (props) => {
  const { onUpdate, config } = props;

  const onChange = (e) => {
    onUpdate({ expressionValue: e.target.value });
  };

  const { expressionValue } = config;

  const expressionValues = {
    raw: 'Raw values',
    zScore: 'Z-score',
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Type</strong></p>
        <Form.Item>
          <Radio.Group
            value={expressionValue}
            onChange={(e) => onChange(e)}
          >
            {Object.keys(expressionValues).map((type) => (
              <Radio value={type} key={type}>
                {expressionValues[type]}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ExpressionValuesType.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ExpressionValuesType;
