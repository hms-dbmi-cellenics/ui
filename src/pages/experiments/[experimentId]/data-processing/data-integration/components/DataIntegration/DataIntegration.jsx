/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React, { useState } from 'react';
import {
  Row, Col, Space, Select,
  InputNumber, Form, Checkbox, Button, Tooltip,
} from 'antd';
import _ from 'lodash';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
// import _ from 'lodash';

import ElbowPlot from './plots/ElbowPlot';
import PlotStyling from '../../../filter-cells/components/PlotStyling';

const { Option } = Select;

const defaultStylingConfig = {
  xAxisText: 'Principal Components',
  yAxisText: 'Proportion of Variance Explained',
  xDefaultTitle: 'Principal Components',
  yDefaultTitle: 'Proportion of Variance Explained',
  titleSize: 12,
  titleText: '',
  titleAnchor: 'start',
  masterFont: 'sans-serif',
  masterSize: 13,
  axisTitlesize: 13,
  axisTicks: 13,
  axisOffset: 0,
  transGrid: 10,
  width: 530,
  height: 400,
  maxWidth: 720,
  maxHeight: 530,
};

const DataIntegration = () => {
  const [plotConfig, setPlotConfig] = useState(defaultStylingConfig);

  const updatePlotWithChanges = (plotConfigUpdates) => {
    const newPlotConfig = _.cloneDeep(plotConfig);
    _.merge(newPlotConfig, plotConfigUpdates);

    setPlotConfig(newPlotConfig);
  };

  return (
    <>
      <Row>
        <Col span={16}>
          <ElbowPlot plotConfig={plotConfig} />
        </Col>
        <Col span={1}>
          <Tooltip title='Dimensionality reduction is necessary to summarise and visualise single cell data. The most common method is Principal Component Analysis (PCA). The user sets the maximum number of PCs.'>
            <Button icon={<InfoCircleOutlined />} />
          </Tooltip>
        </Col>
        <Col span={7}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Form.Item
            label='Method:'
          >
            <Select
              defaultValue='option1'
            >
              <Option value='option1'>PCA</Option>
              <Option value='option2'>option2</Option>
              <Option value='option3'>option3</Option>
            </Select>
          </Form.Item>
          <Form.Item label='Max PCs:'>
            <InputNumber
              defaultValue={10}
              max={50}
              min={1}
              onPressEnter={() => { }}
            />
          </Form.Item>
          <Form.Item label='Exclude genes categories:'>
            <Checkbox.Group onChange={() => { }}>
              <Space direction='vertical'>
                <Checkbox value='ribosomal'>ribosomal</Checkbox>
                <Checkbox value='mitochondrial'>mitochondrial</Checkbox>
                <Checkbox value='cellCycle'>cell cycle</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
          <PlotStyling
            config={plotConfig}
            onUpdate={updatePlotWithChanges}
            singlePlot
          />
        </Col>
      </Row>
    </>
  );
};

export default DataIntegration;
