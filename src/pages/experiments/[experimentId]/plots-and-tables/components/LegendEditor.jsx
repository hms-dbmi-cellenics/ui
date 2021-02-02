import React from 'react';
import PropTypes from 'prop-types';
import { Radio, Form } from 'antd';
import _ from 'lodash';

const defaultOption = {
  positions: 'corners',
  showEnableOption: true,
  showValueOption: true,
};

const LegendEditor = (props) => {
  const {
    enabled,
    position,
    option,
    onEnabledUpdate,
    onValueUpdate,
  } = props;

  const elOption = _.merge(defaultOption, option);

  // Setting object containing value:text of position options
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
  };

  return (
    <Form size='small' labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
      { elOption.showEnableOption && (
        <>
          <p><strong>Enabled</strong></p>
          <Form.Item>
            <Radio.Group onChange={(e) => onEnabledUpdate(e)} value={enabled}>
              <Radio value>Show</Radio>
              <Radio value={false}>Hide</Radio>
            </Radio.Group>
          </Form.Item>
        </>
      )}

      { enabled && elOption.showValueOption && (
        <>
          <p><strong>Position</strong></p>
          <Form.Item>
            <Radio.Group
              onChange={(e) => onValueUpdate(e)}
              value={position}
            >
              {
                Object.entries(positions[elOption.positions]).map(([val, text]) => (
                  <Radio key={val} value={val}>{text}</Radio>
                ))
              }
            </Radio.Group>
          </Form.Item>
        </>
      )}
    </Form>
  );
};

LegendEditor.propTypes = {
  onEnabledUpdate: PropTypes.func.isRequired,
  onValueUpdate: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
  position: PropTypes.string,
  option: PropTypes.object,
};

LegendEditor.defaultProps = {
  enabled: true,
  position: 'top-left',
  option: defaultOption,
};

export default LegendEditor;
