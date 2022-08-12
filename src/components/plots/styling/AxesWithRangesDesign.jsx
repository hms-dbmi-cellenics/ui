import React, { useState } from 'react';
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

  const [newConfig, setNewConfig] = useState(config.axesRanges);

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <AxesDesign
        config={config}
        onUpdate={onUpdate}
      />
      <Collapse>
        <Panel header='Axes Ranges'>
          <Space direction='vertical' style={{ width: '80%' }}>
            <p><strong>Y-Axis</strong></p>
            <Form
              size='small'
              labelCol={{ span: 10 }}
            >
              <Form.Item
                label='Auto'
              >
                <Checkbox
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
                  defaultValue={newConfig.yMin}
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
                  defaultValue={newConfig.yMax}
                  onChange={(value) => {
                    setNewConfig({ ...newConfig, yMax: value });
                  }}
                  disabled={newConfig.yAxisAuto}
                />
              </Form.Item>
            </Form>

            <p><strong>X-Axis</strong></p>
            <Form
              size='small'
              labelCol={{ span: 10 }}
            >
              <Form.Item
                label='Auto'
              >
                <Checkbox
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
                  defaultValue={newConfig.xMin}
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
                  defaultValue={newConfig.xMax}
                  onChange={(value) => {
                    setNewConfig({ ...newConfig, xMax: value });
                  }}
                  disabled={newConfig.xAxisAuto}
                />
              </Form.Item>
            </Form>
            <Space align='end' size={20}>
              <Button
                size='small'
                type='primary'
                disabled={_.isEqual(config.axesRanges, newConfig)}
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
  )
};

AxesWithRangesDesign.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default AxesWithRangesDesign;
