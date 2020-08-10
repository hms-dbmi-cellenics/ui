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
import plot1Pic from '../../../../../../static/media/plot5.png';
import plot2Pic from '../../../../../../static/media/plot6.png';
import plotData from './new_data.json';
import PlotStyling from '../PlotStyling';

const { Panel } = Collapse;
const { Option } = Select;

class ReadAlignment extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      xAxisText: 'log10 [cell size (mol)]',
      yAxisText: 'fraction of intergenic reads',
      xAxisText2: 'fraction of intergenic reads',
      yAxisText2: 'Frequency',
      xDefaultTitle: 'log10 [cell size (mol)]',
      yDefaultTitle: 'fraction of intergenic reads',
      gridWeight: 0,
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      Stringency: 2.1,
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
        autoSize: 'pad',
        signals: [
          {
            name: 'bandwidth',
            value: -1,
            bind: {
              input: 'range', min: -1, max: 100, step: 1,
            },
          },
        ],
        data: [
          {
            name: 'plotData',
            transform: [
              {
                type: 'filter',
                expr: 'datum.cellSize != null && datum.fracMito != null',
              },
            ],
          },
          {
            name: 'density',
            source: 'plotData',
            transform: [
              {
                type: 'kde2d',
                size: [{ signal: 'width' }, { signal: 'height' }],
                x: { expr: "scale('x', datum.cellSize)" },
                y: { expr: "scale('y', datum.fracMito)" },
                bandwidth: { signal: '[bandwidth, bandwidth]' },
                cellSize: 15,
              },
              {
                type: 'isocontour',
                field: 'grid',
                levels: 5,
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
            domain: { data: 'plotData', field: 'cellSize' },
            domainMin: 1,
            range: 'width',
          },
          {
            name: 'y',
            type: 'linear',
            round: true,
            nice: true,
            zero: true,
            domain: { data: 'plotData', field: 'fracMito' },
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
            title: { value: config.xAxisText },
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
            name: 'marks',
            type: 'symbol',
            from: { data: 'plotData' },
            encode: {
              update: {
                x: { scale: 'x', field: 'cellSize' },
                y: { scale: 'y', field: 'fracMito' },
                size: { value: 4 },
                fill: { value: '#ccc' },
              },
            },
          },
          {
            type: 'image',
            from: { data: 'density' },
            encode: {
              update: {
                x: { value: 0 },
                y: { value: 0 },
                width: { signal: 'width' },
                height: { signal: 'height' },
                aspect: { value: false },
              },
            },
            transform: [
              {
                type: 'heatmap',
                field: 'datum.grid',
                color: '#1361a8',
              },
            ],
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
      height: config.width,
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
              field: 'fracMito',
              extent: [0, 1],
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
          domain: { data: 'binned', field: 'bin0' },
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
          grid: true,
          title: { value: config.xAxisText2 },
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
          zindex: 1,
          grid: true,
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

          <Col span={15}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={3}>
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
          <Col span={6}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Collapse>
              <Panel header='Filtering Settings' disabled={!filtering}>
                <Form.Item
                  label='Method:'
                >
                  <Select
                    defaultValue='option1'
                    disabled={!filtering}
                  >
                    <Option value='option1'>Absolute threshold</Option>
                    <Option value='option2'>option2</Option>
                    <Option value='option3'>option3</Option>
                  </Select>
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

export default ReadAlignment;
