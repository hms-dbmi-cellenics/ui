import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Form, Space, Checkbox, InputNumber, Collapse,
} from 'antd';
import _ from 'lodash';
import AxesDesign from 'components/plots/styling/AxesDesign';

const { Panel } = Collapse;

const AxesWithRangesDesign = (props) => {
  const {
    config, onUpdate,
  } = props;

  const hideXRange = typeof config.axesRanges.xAxisAuto === 'undefined';

  const hideYRange = typeof config.axesRanges.yAxisAuto === 'undefined';

  const [newConfig, setNewConfig] = useState(config.axesRanges);

  // if the plot changes, update the config
  useEffect(() => {
    setNewConfig(config.axesRanges);
  }, [config]);

  const disableSave = () => {
    if (_.isEqual(config.axesRanges, newConfig)) return true;

    if (newConfig.xMin > newConfig.xMax) return true;

    if (newConfig.yMin > newConfig.yMax) return true;

    return false;
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <AxesDesign
        config={config}
        onUpdate={onUpdate}
      />
      <Collapse>
        <Panel header='Axes Ranges'>
          <Space direction='vertical' style={{ width: '80%' }}>
            <Space direction='vertical' style={{ width: '100%' }} hidden={hideXRange}>
              <p><strong>X-Axis</strong></p>
              <Form
                size='small'
                labelCol={{ span: 10 }}
              >
                <Form.Item
                  label='Auto'
                >
                  <Checkbox
                    data-testid='xAuto'
                    onChange={() => {
                      setNewConfig({ ...newConfig, xAxisAuto: !newConfig.xAxisAuto });
                    }}
                    defaultChecked
                    checked={newConfig.xAxisAuto}
                  />
                </Form.Item>
                <Form.Item
                  label='Minimum: '
                >
                  <InputNumber
                    data-testid='xMin'
                    value={newConfig.xMin}
                    onChange={(value) => {
                      setNewConfig({ ...newConfig, xMin: value });
                    }}
                    disabled={newConfig.xAxisAuto}
                  />
                </Form.Item>
                <Form.Item
                  label='Maximum:'
                >
                  <InputNumber
                    data-testid='xMax'
                    value={newConfig.xMax}
                    onChange={(value) => {
                      setNewConfig({ ...newConfig, xMax: value });
                    }}
                    disabled={newConfig.xAxisAuto}
                  />
                </Form.Item>
              </Form>
            </Space>

            <Space direction='vertical' style={{ width: '100%' }} hidden={hideYRange}>
              <p><strong>Y-Axis</strong></p>
              <Form
                size='small'
                labelCol={{ span: 10 }}
              >
                <Form.Item
                  label='Auto'
                >
                  <Checkbox
                    data-testid='yAuto'
                    onChange={() => {
                      setNewConfig({ ...newConfig, yAxisAuto: !newConfig.yAxisAuto });
                    }}
                    defaultChecked
                    checked={newConfig.yAxisAuto}
                  />
                </Form.Item>
                <Form.Item
                  label='Minimum: '
                >
                  <InputNumber
                    data-testid='yMin'
                    value={newConfig.yMin}
                    onChange={(value) => {
                      setNewConfig({ ...newConfig, yMin: value });
                    }}
                    disabled={newConfig.yAxisAuto}
                  />
                </Form.Item>
                <Form.Item
                  label='Maximum:'
                >
                  <InputNumber
                    data-testid='yMax'
                    value={newConfig.yMax}
                    onChange={(value) => {
                      setNewConfig({ ...newConfig, yMax: value });
                    }}
                    disabled={newConfig.yAxisAuto}
                  />
                </Form.Item>
              </Form>
            </Space>

            <Space align='end' size={20}>
              <Button
                data-testid='save'
                size='small'
                type='primary'
                disabled={disableSave()}
                onClick={() => {
                  onUpdate({ axesRanges: newConfig });
                }}
              >
                Save
              </Button>
            </Space>
          </Space>
        </Panel>
      </Collapse>
    </Space>
  );
};

AxesWithRangesDesign.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default AxesWithRangesDesign;
