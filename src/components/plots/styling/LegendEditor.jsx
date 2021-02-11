import React from 'react';
import PropTypes from 'prop-types';
import { Radio, Form } from 'antd';
import _ from 'lodash';

const defaultOption = {
  positions: 'corners',
};

const LegendEditor = (props) => {
  const {
    onUpdate, config, option,
  } = props;

  const positions = {
    corners: {
      'top-left': 'Top left',
      'top-right': 'Top right',
      'bottom-left': 'Bottom left',
      'bottom-right': 'Bottom right',
    },
    'top-bottom': {
      top: 'Top',
      bottom: 'Bottom',
    },
    'horizontal-vertical': {
      horizontal: 'Horizontal',
      vertical: 'Vertical',
    },
  };

  return (
    <Form size='small' labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>

      <p><strong>Toggle Legend</strong></p>
      <Form.Item>
        <Radio.Group onChange={(e) => onUpdate({ legend: { enabled: e.target.value } })} value={config.legend.enabled}>
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Form.Item>

      {
        config.legend.enabled && (
          <>
            <p><strong>Position</strong></p>
            <Form.Item>
              <Radio.Group
                onChange={(e) => onUpdate({ legend: { position: e.target.value } })}
                value={config.legend.position}
              >
                {
                  Object.entries(positions[option.positions]).map(([val, text]) => (
                    <Radio key={val} value={val}>{text}</Radio>
                  ))
                }
              </Radio.Group>
            </Form.Item>
          </>
        )
      }

    </Form>
  );
};

LegendEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  option: PropTypes.object,
  config: PropTypes.object.isRequired,
};

LegendEditor.defaultProps = {
  option: defaultOption,
};

export default LegendEditor;
