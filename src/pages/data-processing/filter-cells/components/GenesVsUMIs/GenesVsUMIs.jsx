/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, Space,
  InputNumber, Select, Slider, Form,
} from 'antd';
import _ from 'lodash';
import { Vega } from '../../../../../../node_modules/react-vega';
import plot1Pic from '../../../../../../static/media/plot1.png';
import plot2Pic from '../../../../../../static/media/plot2.png';
import plotData from './new_data.json';
import PlotStyling from '../PlotStyling';

const { Panel } = Collapse;
const { Option } = Select;

class GenesVsUMIs extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      xAxisText: 'log10 [molecules]',
      yAxisText: 'Frequency',
      xAxisText2: 'log10 [molecule counts]',
      yAxisText2: 'log10 [gene counts]',
      xDefaultTitle: 'log10 [molecules]',
      yDefaultTitle: 'Frequency',
      gridWeight: 0,
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
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
    if (config.plotToDraw) {
      return {
        $schema: 'https://vega.github.io/schema/vega/v5.json',
        description: 'An interactive histogram for visualizing a univariate distribution.',
        width: 420,
        height: 300,
        padding: 5,

        signals: [
          {
            name: 'binStep',
            value: 0.05,
            bind: {
              input: 'range', min: 0.001, max: 0.4, step: 0.001,
            },
          },
        ],

        data: [
          {
            name: 'plotData',
          },
          {
            name: 'binned',
            source: 'plotData',
            transform: [
              {
                type: 'bin',
                field: 'molecules',
                extent: [2, 5],
                step: { signal: 'binStep' },
                nice: false,
              },
              {
                type: 'aggregate',
                key: 'bin0',
                groupby: ['bin0', 'bin1'],
                fields: ['bin0'],
                ops: ['count'],
                as: ['count'],
              },
            ],
          },
        ],

        scales: [
          {
            name: 'xscale',
            type: 'linear',
            range: 'width',
            domain: [2, 5],
          },
          {
            name: 'yscale',
            type: 'linear',
            range: 'height',
            round: true,
            domain: { data: 'binned', field: 'count' },
            zero: true,
            nice: true,
          },
        ],

        axes: [
          {
            orient: 'bottom',
            scale: 'xscale',
            zindex: 1,
            title: { value: config.xAxisText },
            titleFont: { value: config.masterFont },
            labelFont: { value: config.masterFont },
            titleFontSize: { value: config.masterSize },
            labelFontSize: { value: config.masterSize },
          },
          {
            orient: 'left',
            scale: 'yscale',
            tickCount: 5,
            zindex: 1,
            title: { value: config.yAxisText },
            titleFont: { value: config.masterFont },
            labelFont: { value: config.masterFont },
            titleFontSize: { value: config.masterSize },
            labelFontSize: { value: config.masterSize },
          },
        ],

        marks: [
          {
            type: 'rect',
            from: { data: 'binned' },
            encode: {
              update: {
                x: { scale: 'xscale', field: 'bin0' },
                x2: {
                  scale: 'xscale',
                  field: 'bin1',
                  offset: { signal: 'binStep > 0.02 ? -0.5 : 0' },
                },
                y: { scale: 'yscale', field: 'count' },
                y2: { scale: 'yscale', value: 0 },
                fill: { value: '#f5ce42' },
              },
              hover: { fill: { value: 'firebrick' } },
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
    return {
      width: 420,
      height: 300,
      padding: 5,

      data: [
        {
          name: 'plotData',
          transform: [
            {
              type: 'filter',
              expr: "datum['genes'] != null && datum['molecules'] != null",
            },
          ],
        },
      ],

      scales: [
        {
          name: 'x',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'plotData', field: 'genes' },
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'plotData', field: 'molecules' },
          range: 'height',
        },
      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: false,
          orient: 'bottom',
          tickCount: 5,
          title: config.xAxisText2,
        },
        {
          scale: 'y',
          grid: true,
          domain: false,
          orient: 'left',
          titlePadding: 5,
          title: config.yAxisText2,
        },
      ],

      marks: [
        {
          name: 'marks',
          type: 'symbol',
          from: { data: 'plotData' },
          encode: {
            update: {
              x: { scale: 'x', field: 'genes' },
              y: { scale: 'y', field: 'molecules' },
              size: { value: 5 },
              strokeWidth: { value: 2 },
              opacity: { value: 0.5 },
              stroke: { value: 'red' },
              fill: { value: 'transparent' },
            },
          },
        },
      ],
    };
  }

  render() {
    const data = { plotData: this.generateData() };
    const { config } = this.state;
    // eslint-disable-next-line react/prop-types
    const { filtering } = this.props;
    const changePlot = (val) => {
      this.updatePlotWithChanges({ plotToDraw: val });
      if (!config.plotToDraw) {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText,
          yDefaultTitle: config.yAxisText,
        });
      } else {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText2,
          yDefaultTitle: config.yAxisText2,
        });
      }
    };
    return (
      <>
        <Row>

          <Col span={12}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={4}>
            <Space direction='vertical'>
              <img
                alt=''
                src={plot1Pic}
                style={{
                  height: '100px',
                  width: '100px',
                  align: 'center',
                  padding: '8px',
                  border: '1px solid #000',
                }}
                onClick={() => changePlot(true)}
              />
              <img
                alt=''
                src={plot2Pic}
                style={{
                  height: '100px',
                  width: '100px',
                  align: 'center',
                  padding: '8px',
                  border: '1px solid #000',
                }}
                onClick={() => changePlot(false)}
              />
            </Space>
          </Col>
          <Col span={8}>
            <Space direction='vertical'>
              <Collapse>
                <Panel header='Filtering Settings' disabled={!filtering}>
                  <Form.Item
                    label='Regression type:'
                  >
                    <Select
                      defaultValue='option1'
                      style={{ width: 200 }}
                      disabled={!filtering}
                    >
                      <Option value='option1'>Gam</Option>
                      <Option value='option2'>option2</Option>
                      <Option value='option3'>option3</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label='Smoothing:'
                  >
                    <Slider
                      defaultValue={13}
                      min={5}
                      max={21}
                    />
                  </Form.Item>
                  <Form.Item
                    label='Stringency:'
                  >
                    <InputNumber
                      disabled={!filtering}
                      defaultValue={0.05}
                      max={1}
                      min={0}
                    //  onPressEnter={(val) => minProbabilityChange(val)}
                    />
                  </Form.Item>
                </Panel>
                <PlotStyling
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                  updatePlotWithChanges={this.updatePlotWithChanges}
                />
              </Collapse>
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default GenesVsUMIs;
