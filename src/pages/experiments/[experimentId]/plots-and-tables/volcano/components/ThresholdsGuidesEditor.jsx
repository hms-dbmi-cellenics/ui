import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, InputNumber, Checkbox, Space, Typography,
} from 'antd';
import ColorBrowser from '../../components/ColorBrowser';

const { Text } = Typography;

const ThresholdsGuidesEditor = (props) => {
  const {
    negLogpValueThreshold,
    showpvalueThresholdGuides,
    logFoldChangeThreshold,
    showLogFoldChangeThresholdGuides,
    thresholdGuideWidth,
    pvalueThresholdColor,
    logFoldChangeThresholdColor,
    onNegLogpValueThresholdUpdate,
    onShowpvalueThresholdGuidesUpdate,
    onLogFoldChangeThresholdUpdate,
    onShowLogFoldChangeThresholdGuidesUpdate,
    onThresholdGuideWidthUpdate,
    onPvalueThresholdColorUpdate,
    onLogFoldChangeThresholdColorUpdate,
  } = props;

  const colorPickerOptions = [
    {
      key: 'pvalueThresholdColor',
      text: 'p-value guide',
      colourHandler: onPvalueThresholdColorUpdate,
      colourValue: pvalueThresholdColor,
    },
    {
      key: 'logFoldChangeThresholdColor',
      text: 'fold change guide',
      colourHandler: onLogFoldChangeThresholdColorUpdate,
      colourValue: logFoldChangeThresholdColor,
    },
  ];

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Significance thresholds</strong></p>
        <Form.Item
          label={(
            <span>
              -log10(pvalue)
            </span>
          )}
        >
          <Space direction='vertical' style={{ width: '100%' }}>
            <Space>
              <InputNumber
                min={0}
                defaultValue={negLogpValueThreshold}
                step={1}
                type='number'
                onChange={(val) => onNegLogpValueThresholdUpdate(val)}
                onStep={(val) => onNegLogpValueThresholdUpdate(val)}
                onPressEnter={(val) => onNegLogpValueThresholdUpdate(val)}
              />
              <Checkbox
                checked={showpvalueThresholdGuides}
                onChange={() => onShowpvalueThresholdGuidesUpdate(!showpvalueThresholdGuides)}
              >
                Show Guideline
              </Checkbox>
            </Space>
            <Text type='secondary'>
              Equivalent to p &lt;
              {' '}
              {(10 ** (-1 * negLogpValueThreshold)).toExponential(3)}
            </Text>
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
              defaultValue={logFoldChangeThreshold}
              onChange={(val) => onLogFoldChangeThresholdUpdate(val)}
              onStep={(val) => onLogFoldChangeThresholdUpdate(val)}
              onPressEnter={(val) => onLogFoldChangeThresholdUpdate(val)}
            />
            <Checkbox
              checked={showLogFoldChangeThresholdGuides}
              onChange={() => onShowLogFoldChangeThresholdGuidesUpdate(!showLogFoldChangeThresholdGuides)}
            >
              Show Guideline
            </Checkbox>
          </Space>
        </Form.Item>

        <p><strong>Guideline Design</strong></p>
        <Form.Item
          label='Width'
        >
          <InputNumber
            min={1}
            defaultValue={thresholdGuideWidth}
            onChange={(val) => onThresholdGuideWidthUpdate(val)}
            onStep={(val) => onThresholdGuideWidthUpdate(val)}
            onPressEnter={(val) => onThresholdGuideWidthUpdate(val)}
          />
        </Form.Item>
        <Form.Item
          label='Colors'
        >
          <ColorBrowser colorPickerOptions={colorPickerOptions} />
        </Form.Item>
      </Form>
    </>
  );
};

ThresholdsGuidesEditor.propTypes = {
  negLogpValueThreshold: PropTypes.number,
  showpvalueThresholdGuides: PropTypes.bool,
  logFoldChangeThreshold: PropTypes.number,
  showLogFoldChangeThresholdGuides: PropTypes.bool,
  thresholdGuideWidth: PropTypes.number,
  pvalueThresholdColor: PropTypes.number,
  logFoldChangeThresholdColor: PropTypes.number,
  onNegLogpValueThresholdUpdate: PropTypes.func.isRequired,
  onShowpvalueThresholdGuidesUpdate: PropTypes.func.isRequired,
  onLogFoldChangeThresholdUpdate: PropTypes.func.isRequired,
  onShowLogFoldChangeThresholdGuidesUpdate: PropTypes.func.isRequired,
  onThresholdGuideWidthUpdate: PropTypes.func.isRequired,
  onPvalueThresholdColorUpdate: PropTypes.func.isRequired,
  onLogFoldChangeThresholdColorUpdate: PropTypes.func.isRequired,
};

ThresholdsGuidesEditor.defaultProps = {
  negLogpValueThreshold: 4,
  showpvalueThresholdGuides: true,
  logFoldChangeThreshold: '#ff0000',
  showLogFoldChangeThresholdGuides: true,
  thresholdGuideWidth: 1,
  pvalueThresholdColor: '#ff0000',
  logFoldChangeThresholdColor: '#ff0000',
};

export default ThresholdsGuidesEditor;
