import React from 'react';
import PropTypes from 'prop-types';

import {
  Form, InputNumber, Checkbox, Space,
} from 'antd';

import ColorBrowser from '../../components/ColorBrowser';

const ThresholdsGuidesEditor = (props) => {
  const { onUpdate, config } = props;

  const colorPickerOptions = [
    {
      config: 'pvalueThresholdColor',
      name: 'p-value guide',
    },
    {
      config: 'logFoldChangeThresholdColor',
      name: 'fold change guide',
    },
  ];

  return (
    <Form
      size='small'
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 12 }}
    >
      <div>Significance thresholds</div>
      <Form.Item
        label={(
          <span>
            p-value
            {' '}
            <em>(linear)</em>
          </span>
        )}
      >
        <Space>
          <InputNumber
            min={0}
            defaultValue={0.05}
            onPressEnter={(e) => {
              const value = parseFloat(e.target.value);
              onUpdate({ pvalueThreshold: value });
            }}
          />
          <Checkbox
            onChange={(e) => {
              const { checked } = e.target;

              if (checked) {
                onUpdate({ showpvalueThresholdGuides: true });
              } else {
                onUpdate({ showpvalueThresholdGuides: false });
              }
            }}
          >
            Guides
          </Checkbox>
        </Space>
      </Form.Item>

      <Form.Item
        label={(
          <span>
            Fold change
            {' '}
            <em>(log2)</em>
          </span>
        )}
      >
        <Space>
          <InputNumber
            min={0}
            defaultValue={1}
            onPressEnter={(e) => {
              const value = parseInt(e.target.value, 10);
              onUpdate({ logFoldChangeThreshold: value });
            }}
          />
          <Checkbox
            onChange={(e) => {
              const { checked } = e.target;

              if (checked) {
                onUpdate({ showLogFoldChangeThresholdGuides: true });
              } else {
                onUpdate({ showLogFoldChangeThresholdGuides: false });
              }
            }}
          >
            Guides
          </Checkbox>
        </Space>
      </Form.Item>

      <div>Threshold guides</div>
      <Form.Item
        label='Width'
      >
        <InputNumber
          min={0}
          defaultValue={1}
          onPressEnter={(e) => {
            const value = parseFloat(e.target.value);
            onUpdate({ thresholdGuideWidth: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='Colors'
      >
        <ColorBrowser onUpdate={onUpdate} colorPickerOptions={colorPickerOptions} config={config} />
      </Form.Item>
    </Form>
  );
};

ThresholdsGuidesEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default ThresholdsGuidesEditor;
