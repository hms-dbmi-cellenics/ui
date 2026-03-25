import React from 'react';
import PropTypes from 'prop-types';
import { Radio, Form, Space } from 'antd';
import _ from 'lodash';
import DebouncedSlider from './DebouncedSlider';
import DebouncedInput from './DebouncedInput';

const defaultOption = {
  positions: 'corners',
};

const LegendEditor = (props) => {
  const {
    onUpdate, config, defaultTitle, showTitleInput = true, showTitleSizeInput = true, showDirectionInput = true,
  } = props;

  let { option } = props;

  option = option ?? defaultOption;

  // Display title - show default if 'title' is in defaultValues, otherwise show custom title
  const displayTitle = config.legend.defaultValues?.includes('title')
    ? defaultTitle
    : config.legend.title;

  const positions = {
    corners: {
      'top-left': 'Top Left',
      'top-right': 'Top Right',
      'bottom-left': 'Bottom Left',
      'bottom-right': 'Bottom Right',
    },
    'top-bottom': {
      left: 'Left',
      right: 'Right',
      top: 'Top',
      bottom: 'Bottom',
    },
    'horizontal-vertical': {
      horizontal: 'Horizontal',
      vertical: 'Vertical',
    },
  };

  return (
    <Form>

      <p><strong>Toggle Legend:</strong></p>
      <Form.Item>
        <Radio.Group
          onChange={(e) => onUpdate({
            legend: {
              enabled: e.target.value,
              showAlert: false,
            },
          })}
          value={config.legend.enabled}
        >
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Form.Item>

      {
        config.legend.enabled && (
          <>
            <p><strong>Position:</strong></p>
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
            {showDirectionInput && config.legend.direction ? (
              <>
                <p><strong>Direction:</strong></p>
                <Form.Item>
                  <Radio.Group
                    onChange={(e) => onUpdate({ legend: { direction: e.target.value } })}
                    value={config.legend.direction}
                  >
                    <Radio key='direction-vertical' value='vertical'>Vertical</Radio>
                    <Radio key='direction-horizontal' value='horizontal'>Horizontal</Radio>
                  </Radio.Group>
                </Form.Item>
              </>
            ) : <></>}

            {showTitleInput && (
              <Form.Item
                label='Title Text:'
                labelCol={{ span: 8, style: { textAlign: 'left' } }}
                wrapperCol={{ span: 19 }}
              >
                <DebouncedInput
                  value={displayTitle || ''}
                  debounceMs={600}
                  onUpdate={(value) => {
                    onUpdate({
                      legend: {
                        title: value,
                        defaultValues: _.without(config.legend.defaultValues, 'title'),
                      },
                    });
                  }}
                />
              </Form.Item>
            )}

            {showTitleInput && (
              <Form.Item
                label='Title Size:'
                labelCol={{ span: 8, style: { textAlign: 'left' } }}
                wrapperCol={{ span: 16 }}
                style={{ marginBottom: 0 }}
              >
                <DebouncedSlider
                  value={config.legend.titleFontSize || 12}
                  min={8}
                  max={24}
                  path='legend.titleFontSize'
                  onUpdate={onUpdate}
                  debounceMs={300}
                  marks={{ 8: 8, 24: 24 }}
                />
              </Form.Item>
            )}

            {!showTitleInput && showTitleSizeInput && (
              <Form.Item
                label='Title Size:'
                labelCol={{ span: 8, style: { textAlign: 'left' } }}
                wrapperCol={{ span: 16 }}
                style={{ marginBottom: 0, marginTop: '15px' }}
              >
                <DebouncedSlider
                  value={config.legend.titleFontSize || 12}
                  min={8}
                  max={24}
                  path='legend.titleFontSize'
                  onUpdate={onUpdate}
                  debounceMs={300}
                  marks={{ 8: 8, 24: 24 }}
                />
              </Form.Item>
            )}
            <Form.Item
              label='Label Size:'
              labelCol={{ span: 8, style: { textAlign: 'left' } }}
              wrapperCol={{ span: 16 }}
              style={{ marginBottom: 0, marginTop: '15px' }}
            >
              <DebouncedSlider
                value={config.legend.labelFontSize || 11}
                min={8}
                max={24}
                path='legend.labelFontSize'
                onUpdate={onUpdate}
                debounceMs={300}
                marks={{ 8: 8, 24: 24 }}
              />
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
  defaultTitle: PropTypes.string,
  showTitleInput: PropTypes.bool,
  showTitleSizeInput: PropTypes.bool,
  showDirectionInput: PropTypes.bool,
};

LegendEditor.defaultProps = {
  option: defaultOption,
  defaultTitle: null,
  showTitleInput: true,
  showTitleSizeInput: true,
  showDirectionInput: true,
};

export default LegendEditor;
