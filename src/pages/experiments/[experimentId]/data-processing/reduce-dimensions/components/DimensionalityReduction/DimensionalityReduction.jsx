/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Row, Col, Space, Select,
  InputNumber, Form, Checkbox, Button, Tooltip,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plotData from './new_data.json';
import PlotStyling from '../../../filter-cells/components/PlotStyling';

const { Option } = Select;

class Classifier extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      data: plotData,
      xAxisText: 'Principal Components',
      yAxisText: 'Proportion of Variance Explained',
      xDefaultTitle: 'Principal Components',
      yDefaultTitle: 'Proportion of Variance Explained',
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      minProbability: 10,
      axisTitlesize: 13,
      axisTicks: 13,
      axisOffset: 0,
      transGrid: 10,
      width: 530,
      height: 400,
      value: 'ribosomal',
      maxWidth: 720,
      maxHeight: 530,
    };
    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: plotData,
    };
    this.updatePlotWithChanges = this.updatePlotWithChanges.bind(this);
  }

  updatePlotWithChanges(obj) {
    this.setState((prevState) => {
      const newState = _.cloneDeep(prevState);

      _.merge(newState.config, obj);

      return newState;
    });
  }

  generateData() {
    const { data } = this.state;
    return data;
  }

  generateSpec() {
    const { config } = this.state;
    return {
      width: config.width,
      height: config.height,
      autosize: { type: 'fit', resize: true },
      padding: 5,

      signals: [
        {
          name: 'interpolate',
          value: 'linear',
          bind: {
            input: 'select',
            options: [
              'basis',
              'cardinal',
              'catmull-rom',
              'linear',
              'monotone',
              'natural',
              'step',
              'step-after',
              'step-before',
            ],
          },
        },
      ],

      data: [
        {
          name: 'plotData',
          transform: [
            {
              type: 'formula',
              as: 'percent',
              expr: 'datum.percentVariance',
            },
          ],
        },
      ],

      scales: [
        {
          name: 'x',
          type: 'linear',
          range: 'width',
          domain: { data: 'plotData', field: 'PC' },
        },
        {
          name: 'y',
          type: 'linear',
          range: 'height',
          nice: true,
          zero: true,
          domain: { data: 'plotData', field: 'percent' },
        },
      ],

      axes: [
        {
          orient: 'bottom',
          scale: 'x',
          grid: true,
          tickCount: 15,
          zindex: 1,
          title: { value: config.xAxisText },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.axisTitlesize },
          labelFontSize: { value: config.axisTicks },
          offset: { value: config.axisOffset },
          gridOpacity: { value: (config.transGrid / 20) },
        },
        {
          orient: 'left',
          scale: 'y',
          grid: true,
          format: '%',
          zindex: 1,
          title: { value: config.yAxisText },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.axisTitlesize },
          labelFontSize: { value: config.axisTicks },
          offset: { value: config.axisOffset },
          gridOpacity: { value: (config.transGrid / 20) },
        },
      ],

      marks: [
        {
          type: 'line',
          from: { data: 'plotData' },
          encode: {
            enter: {
              x: { scale: 'x', field: 'PC' },
              y: { scale: 'y', field: 'percent' },
              strokeWidth: { value: 2 },
            },
            update: {
              interpolate: { signal: 'interpolate' },
              strokeOpacity: { value: 1 },
            },
            hover: {
              strokeOpacity: { value: 0.5 },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { scale: 'x', value: config.minProbability, round: true },
              y: { value: 0 },
              y2: { field: { group: 'height' } },
              strokeWidth: { value: 2 },
              strokeDash: { value: [8, 4] },
              stroke: { value: 'red' },
            },
          },
        },
      ],
      title:
      {
        text: { value: config.titleText },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
        dx: 10,
        fontSize: { value: config.titleSize },
      },
    };
  }

  render() {
    const data = { plotData: this.generateData() };
    const { config } = this.state;
    // eslint-disable-next-line react/prop-types
    const minProbabilityChange = (val) => {
      this.updatePlotWithChanges({ minProbability: val.target.value });
    };
    const geneCategoryChange = (val) => {
      this.updatePlotWithChanges({
        value: val,
      });
    };
    return (
      <>
        <Row>

          <Col span={16}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
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
                onPressEnter={(val) => minProbabilityChange(val)}
              />
            </Form.Item>
            <Form.Item label='Exclude genes categories:'>
              <Checkbox.Group onChange={geneCategoryChange}>
                <Space direction='vertical'>
                  <Checkbox value='ribosomal'>ribosomal</Checkbox>
                  <Checkbox value='mitochondrial'>mitochondrial</Checkbox>
                  <Checkbox value='cellCycle'>cell cycle</Checkbox>
                </Space>
              </Checkbox.Group>
            </Form.Item>
            <PlotStyling
              config={config}
              onUpdate={this.updatePlotWithChanges}
              updatePlotWithChanges={this.updatePlotWithChanges}
              singlePlot
            />
          </Col>
        </Row>
      </>
    );
  }
}

export default Classifier;
