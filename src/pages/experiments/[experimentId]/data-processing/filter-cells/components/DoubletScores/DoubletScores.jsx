import React from 'react';
import {
  Collapse, Row, Col, Space,
  Slider, Form, Button, Tooltip,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plotData from './new_data.json';
import PlotStyling from '../PlotStyling';
import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

const { Panel } = Collapse;
class DoubletScores extends React.Component {
  constructor(props) {
    super(props);
    this.defaultConfig = {
      data: plotData,
      legendEnabled: true,
      minCellSize: 1000,
      xAxisText: 'Probability of being a doublet',
      yAxisText: 'Frequency',
      xDefaultTitle: 'Probability of being a doublet',
      yDefaultTitle: 'Frequency',
      legendOrientation: 'top-right',
      gridWeight: 0,
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      probThreshold: 0.2,
      axisTitlesize: 13,
      axisTicks: 13,
      axisOffset: 0,
      transGrid: 0,
      width: 630,
      height: 500,
      maxWidth: 789,
      maxHeight: 560,
      binStep: 0.05,
    };
    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: plotData,
    };
    this.updatePlotWithChanges = this.updatePlotWithChanges.bind(this);
  }

  generateData() {
    const { data } = this.state;
    return data;
  }

  updatePlotWithChanges(obj) {
    this.setState((prevState) => {
      const newState = _.cloneDeep(prevState);

      _.merge(newState.config, obj);

      return newState;
    });
  }

  generateSpec() {
    const { config } = this.state;
    let legend = null;
    const colorExpression = `(datum.bin1 <= ${config.probThreshold}) ? 'high score' : 'low score'`;
    if (config.legendEnabled) {
      legend = [
        {
          fill: 'color',
          orient: config.legendOrientation,
          encode: {
            title: {
              update: {
                fontSize: { value: 14 },
              },
            },
            labels: {
              interactive: true,
              update: {
                fontSize: { value: 12 },
                fill: { value: 'black' },
              },
            },
            symbols: {
              update: {
                stroke: { value: 'transparent' },
              },
            },
            legend: {
              update: {
                stroke: { value: '#ccc' },
                strokeWidth: { value: 1.5 },
              },
            },
          },
        },
      ];
    } else {
      legend = null;
    }
    return {
      width: config.width,
      height: config.height,
      autosize: { type: 'fit', resize: true },
      padding: 5,

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
              field: 'doubletP',
              extent: [0, 1],
              step: config.binStep,
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
            {
              type: 'formula',
              as: 'count',
              expr: 'datum.count/1000',
            },
            {
              type: 'formula',
              as: 'status',
              expr: colorExpression,
            },
          ],
        },
      ],

      scales: [
        {
          name: 'xscale',
          type: 'linear',
          range: 'width',
          domain: [0, 1],
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
        {
          name: 'color',
          type: 'ordinal',
          range:
            [
              'green', 'blue',
            ],
          domain: {
            data: 'binned',
            field: 'status',
            sort: true,
          },
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
              },
              y: { scale: 'yscale', field: 'count' },
              y2: { scale: 'yscale', value: 0 },
              fill: {
                scale: 'color',
                field: 'status',
              },
            },
          },
        },
        {
          type: 'rect',
          from: { data: 'plotData' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'datum.fracMito' },
              width: { value: 1 },
              y: { value: 25, offset: { signal: 'height' } },
              height: { value: 5 },
              fillOpacity: { value: 0.4 },
              fill: {
                scale: 'color',
                field: 'status',
              },
            },
          },
        },
      ],
      legends: legend,
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
    const changeThreshold = (val) => {
      this.updatePlotWithChanges({ probThreshold: val });
    };
    return (
      <>
        <Row>

          <Col span={17}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>
          <Col span={1}>
            <Tooltip placement="bottom" title='Droplets may contain more than one cell. In such cases, it is not possible to distinguish which reads came from which cell. Such “cells” cause problems in the downstream analysis as they appear as an intermediate type. “Cells” with a high probability of being a doublet should be excluded. The cut-off is typically set around 0.25.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>
          </Col>
          <Col span={6}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Filtering settings' disabled={!filtering} key='1'>
                <Form.Item label='Probability threshold'>
                  <Slider
                    disabled={!filtering}
                    defaultValue={0.2}
                    min={0}
                    max={1}
                    onAfterChange={(val) => changeThreshold(val)}
                    step={0.05}
                  />
                </Form.Item>
                <BandwidthOrBinstep
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                  type={'bin step'}
                />
              </Panel>
              <PlotStyling
                config={config}
                onUpdate={this.updatePlotWithChanges}
                updatePlotWithChanges={this.updatePlotWithChanges}
                singlePlot
                legendMenu
              />
            </Collapse>
          </Col>
        </Row>
      </>
    );
  }
}

export default DoubletScores;
