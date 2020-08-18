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
import plot1Pic from '../../../../../../static/media/plot7.png';
import plot2Pic from '../../../../../../static/media/plot8.png';
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
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      Stringency: 4.8,
      Stringency2: 3.6,
      cutoff: 2.1,
      cutoff2: 2.1,
      axisTitlesize: 13,
      axisTicks: 13,
      axisOffset: 0,
      transGrid: 10,
      width: 530,
      height: 400,
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
        width: config.width,
        height: config.height,
        autosize: { type: 'fit', resize: true },
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
            domainMin: 2,

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
            grid: true,
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
            scale: 'yscale',
            tickCount: 5,
            grid: true,
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
            },
          },
          {
            type: 'rule',
            encode: {
              update: {
                x: { scale: 'xscale', value: config.cutoff },
                y: { value: 0 },
                y2: { field: { group: 'height' } },
                strokeWidth: { value: 2 },
                strokeDash: { value: [8, 4] },
                stroke: { value: 'red' },
              },
            },
          },
          {
            type: 'rule',
            encode: {
              update: {
                x: { scale: 'xscale', value: config.Stringency },
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
    return {
      width: config.width,
      height: config.height,
      autosize: { type: 'fit', resize: true },
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
          domain: [0, 4],
          domainMin: 2,
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'plotData', field: 'molecules' },
          domainMin: 2,
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
          zindex: 1,
          title: { value: config.xAxisText2 },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.axisTitlesize },
          labelFontSize: { value: config.axisTicks },
          offset: { value: config.axisOffset },
          gridOpacity: { value: (config.transGrid / 20) },
        },
        {
          scale: 'y',
          grid: true,
          domain: false,
          orient: 'left',
          titlePadding: 5,
          zindex: 1,
          title: { value: config.yAxisText2 },
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
          name: 'marks',
          type: 'symbol',
          from: { data: 'plotData' },
          encode: {
            update: {
              x: { scale: 'x', field: 'genes' },
              y: { scale: 'y', field: 'molecules' },
              size: { value: 3 },
              strokeWidth: { value: 2 },
              opacity: { value: 0.2 },
              fill: { value: 'red' },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { scale: 'x', value: config.cutoff2 },
              y: { value: 0 },
              y2: { field: { group: 'height' } },
              strokeWidth: { value: 2 },
              strokeDash: { value: [8, 4] },
              stroke: { value: 'red' },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { scale: 'x', value: config.Stringency2 },
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
    const updateStringency = (val) => {
      if (config.plotToDraw) {
        this.updatePlotWithChanges({ Stringency: val.target.value })
      } else {
        this.updatePlotWithChanges({ Stringency2: val.target.value })
      }
    };
    const updateCutoff = (val) => {
      if (config.plotToDraw) {
        this.updatePlotWithChanges({ cutoff: val.target.value })
      } else {
        this.updatePlotWithChanges({ cutoff2: val.target.value })
      }
    };
    return (
      <>
        <Row>

          <Col span={15}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={3}>
            <Space direction='vertical' style={{ width: '100%' }}>
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
          <Col span={6}>
            <Space direction='vertical' style={{ width: '100%' }} />
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
                    disabled={!filtering}
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
                    max={5}
                    min={0}
                    onPressEnter={
                      (val) => updateStringency(val)
                    }
                  />
                </Form.Item>
                <Form.Item
                  label='Lower cutoff:'
                >
                  <InputNumber
                    disabled={!filtering}
                    max={5}
                    min={0}
                    onPressEnter={
                      (val) => updateCutoff(val)
                    }
                  />
                </Form.Item>
              </Panel>
              <PlotStyling
                config={config}
                onUpdate={this.updatePlotWithChanges}
                updatePlotWithChanges={this.updatePlotWithChanges}
              />
            </Collapse>
          </Col>
        </Row>
      </>
    );
  }
}

export default GenesVsUMIs;
