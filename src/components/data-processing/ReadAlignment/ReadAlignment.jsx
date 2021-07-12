/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, Space,
  Slider, Select, Form, Button, Tooltip,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../../../../../static/media/plot5.png';
import plot2Pic from '../../../../../../../../static/media/plot6.png';
import plotData from './new_data.json';
import OldPlotStyling from '../../../../../../../components/plots/styling/OldPlotStyling';
import BandwidthOrBinstep from './PlotStyleMisc';

const { Panel } = Collapse;
const { Option } = Select;

class ReadAlignment extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      xAxisText: 'fraction of intergenic reads',
      yAxisText: 'log10 ( #UMIs )',
      xAxisText2: 'fraction of intergenic reads',
      yAxisText2: 'Frequency',
      xDefaultTitle: 'fraction of intergenic reads',
      yDefaultTitle: 'log10 ( #UMIs )',
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
      maxWidth: 660,
      maxHeight: 560,
      threshold: 0.5,
      binStep: 0.05,
      bandwidth: -1,
      type: 'bandwidth',
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
                x: { expr: "scale('x', datum.fracMito)" },
                y: { expr: "scale('y', datum.cellSize)" },
                bandwidth: [config.bandwidth, config.bandwidth],
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
            domain: { data: 'plotData', field: 'fracMito' },
            range: 'width',
          },
          {
            name: 'y',
            type: 'linear',
            round: true,
            nice: true,
            zero: true,
            domainMin: 1,
            domain: { data: 'plotData', field: 'cellSize' },
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
            title: config.xAxisText,
            titleFont: config.masterFont,
            labelFont: config.masterFont,
            titleFontSize: config.axisTitlesize,
            labelFontSize: config.axisTicks,
            offset: config.axisOffset,
            gridOpacity: (config.transGrid / 20),

          },
          {
            scale: 'y',
            grid: true,
            domain: false,
            orient: 'left',
            titlePadding: 5,
            zindex: 1,
            title: config.yAxisText,
            titleFont: config.masterFont,
            labelFont: config.masterFont,
            titleFontSize: config.axisTitlesize,
            labelFontSize: config.axisTicks,
            offset: config.axisOffset,
            gridOpacity: (config.transGrid / 20),

          },
        ],
        marks: [
          {
            name: 'marks',
            type: 'symbol',
            from: { data: 'plotData' },
            encode: {
              update: {
                x: { scale: 'x', field: 'fracMito' },
                y: { scale: 'y', field: 'cellSize' },
                size: 4,
                fill: '#ccc',
              },
            },
          },
          {
            type: 'image',
            from: { data: 'density' },
            encode: {
              update: {
                x: 0,
                y: 0,
                width: { signal: 'width' },
                height: { signal: 'height' },
                aspect: false,
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
          {
            type: 'rule',
            encode: {
              update: {
                x: { scale: 'x', value: config.threshold },
                y: 0,
                y2: { field: { group: 'height' } },
                strokeWidth: 2,
                strokeDash: [8, 4],
                stroke: 'red',
              },
            },
          },
        ],
        title:
        {
          text: config.titleText,
          anchor: config.titleAnchor,
          font: config.masterFont,
          dx: 10,
          fontSize: config.titleSize,
        },
      };
    }
    return {
      width: config.width,
      height: config.width,
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
          title: config.xAxisText2,
          titleFont: config.masterFont,
          labelFont: config.masterFont,
          titleFontSize: config.axisTitlesize,
          labelFontSize: config.axisTicks,
          offset: config.axisOffset,
          gridOpacity: (config.transGrid / 20),
        },
        {
          orient: 'left',
          scale: 'yscale',
          tickCount: 5,
          zindex: 1,
          grid: true,
          title: config.yAxisText2,
          titleFont: config.masterFont,
          labelFont: config.masterFont,
          titleFontSize: config.axisTitlesize,
          labelFontSize: config.axisTicks,
          offset: config.axisOffset,
          gridOpacity: (config.transGrid / 20),
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
                // offset: `${config.binStep} > 0.02 ? -0.5 : 0`,

              },
              y: { scale: 'yscale', field: 'count' },
              y2: { scale: 'yscale', value: 0 },
              fill: '#f5ce42',
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { scale: 'xscale', value: config.threshold },
              y: 0,
              y2: { field: { group: 'height' } },
              strokeWidth: 2,
              strokeDash: [8, 4],
              stroke: 'red',
            },
          },
        },
      ],
      title:
      {
        text: config.titleText,
        anchor: config.titleAnchor,
        font: config.masterFont,
        dx: 10,
        fontSize: config.titleSize,
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
          type: 'bandwidth',
        });
      } else {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText2,
          yDefaultTitle: config.yAxisText2,
          type: 'bin step',
        });
      }
    };
    const changeThreshold = (val) => {
      this.updatePlotWithChanges({ threshold: val });
    };
    return (
      <>
        <Row>

          <Col span={15}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={3}>
            <Space direction='vertical'>
              <Tooltip placement='bottom' title='Dead and dying cells may display a high fraction of intergenic reads as a result of contaminating genomic DNA. The cut-off is typically set around 0.6-0.9.'>
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
              <Panel header='Filtering Settings' collapsible={!filtering ? 'disabled' : 'header'} key='filtering-settings'>
                <Form.Item
                  label='Method:'
                >
                  <Select
                    defaultValue='option1'
                    collapsible={!filtering ? 'disabled' : 'header'}
                  >
                    <Option value='option1'>Absolute threshold</Option>
                    <Option value='option2'>option2</Option>
                    <Option value='option3'>option3</Option>
                  </Select>
                </Form.Item>
                <Form.Item label='Filter threshold'>
                  <Slider
                    defaultValue={0.5}
                    min={0}
                    max={0.8}
                    step={0.01}
                    onAfterChange={(val) => changeThreshold(val)}
                  />
                </Form.Item>
                <BandwidthOrBinstep
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                  type={config.type}
                />
              </Panel>

              {/* Temporary placeholder, replace with <PlotStyling> when working on this component */}
              <OldPlotStyling
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
