/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, Space, Slider,
  Select, Form, Tooltip, Button,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../../../../../static/media/plot3.png';
import plot2Pic from '../../../../../../../../static/media/plot4.png';
import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';
import plotData from './data2.json';

import PlotStyling from '../../../../../../../components/plots/styling/PlotStyling';

const { Panel } = Collapse;
const { Option } = Select;
class MitochondrialContent extends React.Component {
  constructor(props) {
    super(props);
    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      xAxisText: 'Fraction of mitochondrial reads',
      yAxisText: 'Fraction of cells',
      xAxisText2: 'log10(#UMIs in cell)',
      yAxisText2: 'Fraction of mitochondrial reads',
      xDefaultTitle: 'Fraction of mitochondrial reads',
      yDefaultTitle: 'Fraction of cells',
      legendPosition: 'top-right',
      gridWeight: 0,
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      maxFraction: 0.1,
      maxFraction2: 3.5,
      axisTitlesize: 13,
      axisTicks: 13,
      axisOffset: 0,
      transGrid: 0,
      width: 530,
      height: 400,
      maxWidth: 660,
      maxHeight: 560,
      placeholder: 0.1,
      sliderMax: 1,
      sliderMin: 0,
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
    const colorExpression = `(datum.bin1 <= ${config.maxFraction}) ? 'Alive' : 'Dead'`;
    const colorExpression2 = '(datum.bin1 <= 2.5) ? \'Dead\' : (datum.bin1 >=3.5) ? \'Live\' : \'Unknown\'';
    if (config.legendEnabled) {
      legend = [
        {
          fill: 'color',
          orient: config.legendPosition,
          labelFont: config.masterFont,
          titleFont: config.masterFont,
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
    if (config.plotToDraw) {
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
                field: 'fracMito',
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
                expr: 'datum.count/10000',
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
              sort: false,
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
          {
            type: 'rule',
            encode: {
              update: {
                x: { scale: 'xscale', value: config.maxFraction },
                y: { value: 0 },
                y2: { field: { group: 'height' } },
                strokeWidth: { value: 2 },
                strokeDash: { value: [8, 4] },
                stroke: { value: 'red' },
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

    return {
      width: config.width,
      height: config.height,
      padding: 5,
      autosize: { type: 'fit', resize: true },
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
              field: 'cellSize',
              extent: [0, 6],
              step: config.binStep,
              nice: false,
            },
            {
              type: 'aggregate',
              key: 'bin0',
              groupby: ['bin0', 'bin1'],
              fields: ['fracMito'],
              ops: ['average'],
              as: ['averageFracMito'],
            },
            {
              type: 'formula',
              as: 'status',
              expr: colorExpression2,
            },
          ],
        },
      ],

      scales: [
        {
          name: 'xscale',
          type: 'linear',
          range: 'width',
          domain: [1, 4.5],
          domainMin: 1,
        },
        {
          name: 'yscale',
          type: 'linear',
          range: 'height',
          round: true,
          domain: { data: 'binned', field: 'averageFracMito' },
          zero: true,
          nice: true,
        },
        {
          name: 'color',
          type: 'ordinal',
          range:
            [
              'blue', 'green', 'grey',
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
          grid: true,
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
          type: 'rect',
          from: { data: 'binned' },
          encode: {
            update: {
              x: { scale: 'xscale', field: 'bin0' },
              x2: {
                scale: 'xscale',
                field: 'bin1',
              },
              y: { scale: 'yscale', field: 'averageFracMito' },
              y2: { scale: 'yscale', value: 0 },
              fill: {
                scale: 'color',
                field: 'status',
              },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { scale: 'xscale', value: config.maxFraction2 },
              y: { value: 0 },
              y2: { field: { group: 'height' } },
              strokeWidth: { value: 2 },
              strokeDash: { value: [8, 4] },
              stroke: { value: 'red' },
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

    const changePlot = (val) => {
      this.updatePlotWithChanges({ plotToDraw: val });
      if (val) {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText,
          yDefaultTitle: config.yAxisText,
          placeholder: 0.1,
          sliderMax: 1,
          sliderMin: 0,
        });
      } else {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText2,
          yDefaultTitle: config.yAxisText2,
          placeholder: 3.5,
          sliderMax: 4.5,
          sliderMin: 1,
        });
      }
    };
    const changeFraction = (val) => {
      if (config.plotToDraw) {
        this.updatePlotWithChanges({ maxFraction: val });
      } else {
        this.updatePlotWithChanges({ maxFraction2: val });
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
              <Tooltip title='A high fraction of mitochondrial reads is an indicator of cell death. The usual range for this cut-off is 0.1-0.5.'>
                <Button icon={<InfoCircleOutlined />} />
              </Tooltip>
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
            <Collapse defaultActiveKey={['filtering-settings']}>
              <Panel header='Filtering settings' collapsible={!filtering ? 'disabled' : 'header'} key='filtering-settings'>
                <Form.Item label='Method:'>
                  <Select
                    defaultValue='option1'
                    style={{ width: 200 }}
                    collapsible={!filtering ? 'disabled' : 'header'}
                  >
                    <Option value='option1'>Absolute threshold</Option>
                    <Option value='option2'>option2</Option>
                    <Option value='option3'>option3</Option>
                  </Select>
                </Form.Item>
                <Form.Item label='Max fraction:'>
                  <Slider
                    defaultValue={config.placeholder}
                    min={config.sliderMin}
                    max={config.sliderMax}
                    step={0.05}
                    collapsible={!filtering ? 'disabled' : 'header'}
                    onAfterChange={(val) => changeFraction(val)}
                  />
                </Form.Item>
                <BandwidthOrBinstep
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                  type='bin step'
                />
              </Panel>
              <PlotStyling
                config={config}
                onUpdate={this.updatePlotWithChanges}
                updatePlotWithChanges={this.updatePlotWithChanges}
                legendMenu
              />
            </Collapse>
          </Col>
        </Row>
      </>
    );
  }
}

export default MitochondrialContent;
