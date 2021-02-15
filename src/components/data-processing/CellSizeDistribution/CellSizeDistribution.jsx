/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import {
  Collapse,
  Row,
  Col,
  List,
  Space,
  Form,
  Tooltip,
  Button,
  InputNumber,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../static/media/plot1.png';
import plot2Pic from '../../../../static/media/plot2.png';
import plotData2 from './cellRank_sorted.json';
import plotData from './new_data.json';
import PlotStyling from '../../plot-styling/PlotStyling';
import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

const { Panel } = Collapse;

class CellSizeDistribution extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      minCellSize: 10800,
      minCellSize2: 990,
      xAxisText: '#UMIs in cell',
      yAxisText: '#UMIs * #Cells',
      xAxisText2: 'Cell rank',
      yAxisText2: '#UMIs in cell',
      xDefaultTitle: '#UMIs in cell',
      yDefaultTitle: '#UMIs * #Cells',
      legendPosition: 'top-left',
      gridWeight: 0,
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      axisTitlesize: 13,
      axisTicks: 13,
      axisOffset: 0,
      transGrid: 0,
      width: 530,
      height: 400,
      maxWidth: 650,
      maxHeight: 540,
      arrowStep: 1000,
      placeholder: 10800,
      sliderMax: 17000,
      binStep: 200,
      type: 'bin step',
    };
    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: plotData,
      data2: plotData2,
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
    let { data } = this.state;
    data = _.cloneDeep(data);
    data = data.map((datum) => {
      let newStatus;

      if (datum.u <= 8800) {
        newStatus = 'low';
      } else if (datum.u >= 10800) {
        newStatus = 'high';
      } else {
        newStatus = 'unknown';
      }

      // eslint-disable-next-line no-param-reassign
      datum.status = newStatus;

      return datum;
    });
    return data;
  }

  generateData2() {
    let { data2 } = this.state;
    data2 = _.cloneDeep(data2);
    return data2;
  }

  generateSpec() {
    const { config } = this.state;
    let legend = null;
    const minHigh = 2500;
    const minUnknown = 2300;
    const coloringExpressionPlot1 = "(datum.bin1 < 8800) ? 'low' : (datum.bin1 >10800) ? 'high' : 'unknown'";
    const coloringExpressionPlot2 = `(datum.u < ${minUnknown}) ? 'low' : (datum.u >${minHigh}) ? 'high' : 'unknown'`;

    if (config.legendEnabled) {
      legend = [
        {
          fill: 'color',
          orient: config.legendPosition,
          title: 'Quality',
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
        description: 'An interactive histogram',
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
                field: 'u',
                extent: [0, 17000],
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
                as: 'status',
                expr: coloringExpressionPlot1,
              },
            ],
          },
        ],

        scales: [
          {
            name: 'xscale',
            type: 'linear',
            range: 'width',
            domain: [1000, 17000],
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
            range: ['green', '#f57b42', 'grey'],
            domain: {
              data: 'plotData',
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
            gridOpacity: { value: config.transGrid / 20 },
          },
          {
            orient: 'left',
            scale: 'yscale',
            grid: true,
            zindex: 1,
            title: { value: config.yAxisText },
            titleFont: { value: config.masterFont },
            labelFont: { value: config.masterFont },
            titleFontSize: { value: config.axisTitlesize },
            labelFontSize: { value: config.axisTicks },
            offset: { value: config.axisOffset },
            gridOpacity: { value: config.transGrid / 20 },
          },
        ],
        marks: [
          {
            type: 'rect',
            from: { data: 'binned' },
            encode: {
              enter: {
                x: { scale: 'xscale', field: 'bin0' },
                x2: {
                  scale: 'xscale',
                  field: 'bin1',
                },
                y: { scale: 'yscale', field: 'count' },
                y2: { scale: 'yscale', value: 0 },
                stroke: { value: 'black' },
                strokeWidth: { value: 0.5 },
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
                x: { scale: 'xscale', value: config.minCellSize },
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
        title: {
          text: { value: config.titleText },
          anchor: { value: config.titleAnchor },
          font: { value: config.masterFont },
          dx: 10,
          fontSize: { value: config.titleSize },
        },
      };
    }
    return {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      width: config.width,
      height: config.height,
      autosize: { type: 'fit', resize: true },
      padding: 5,

      data: [
        {
          name: 'plotData2',
          transform: [
            {
              type: 'formula',
              as: 'status2',
              expr: coloringExpressionPlot2,
            },
            {
              type: 'filter',
              expr: 'datum.u > 0 && datum.rank > 0',
            },
            {
              type: 'formula',
              as: 'logRankValue',
              expr: '(log(datum.rank) / LN10)*2200',
            },
          ],
        },
      ],

      scales: [
        {
          name: 'xscale',
          type: 'log',
          range: 'width',
          domain: { data: 'plotData2', field: 'u' },
        },
        {
          name: 'yscale',
          type: 'linear',
          range: 'height',
          nice: true,
          domain: { data: 'plotData2', field: 'logRankValue' },
        },
        {
          name: 'color',
          type: 'ordinal',
          range: ['green', '#f57b42', 'grey'],
          domain: {
            data: 'plotData2',
            field: 'status2',
          },
        },
      ],

      axes: [
        {
          orient: 'bottom',
          scale: 'xscale',
          tickCount: 5,
          grid: true,
          zindex: 1,
          title: { value: config.xAxisText2 },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.axisTitlesize },
          labelFontSize: { value: config.axisTicks },
          offset: { value: config.axisOffset },
          gridOpacity: { value: config.transGrid / 20 },
        },
        {
          orient: 'left',
          scale: 'yscale',
          grid: true,
          zindex: 1,
          title: { value: config.yAxisText2 },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.axisTitlesize },
          labelFontSize: { value: config.axisTicks },
          offset: { value: config.axisOffset },
          gridOpacity: { value: config.transGrid / 20 },
        },
      ],

      marks: [
        {
          type: 'area',
          from: { data: 'plotData2' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'u' },
              y: { scale: 'yscale', field: 'logRankValue' },
              y2: { scale: 'yscale', value: 0 },
              fill: {
                scale: 'color',
                field: 'status2',
              },
            },
            update: {
              fillOpacity: { value: 1 },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { scale: 'xscale', value: config.minCellSize2 },
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
      title: {
        text: { value: config.titleText },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
        dx: 10,
        fontSize: { value: config.titleSize },
      },
    };
  }

  render() {
    const { config } = this.state;
    // eslint-disable-next-line react/prop-types
    const { filtering } = this.props;
    let data = { plotData: this.generateData() };
    if (!config.plotToDraw) {
      data = { plotData2: this.generateData2() };
    }

    const listData = [
      'Estimated number of cells 8672',
      'Fraction reads in cells  93.1%',
      'Mean reads per cell  93,551',
      'Median genes per cell  1,297',
      'Total genes detected   21,425',
      'Median UMI counts per cell   4,064',
    ];
    const changePlot = (val) => {
      this.updatePlotWithChanges({ plotToDraw: val });
      if (val) {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText,
          yDefaultTitle: config.yAxisText,
          placeholder: 10800,
          sliderMax: 17000,
          type: 'bin step',
        });
      } else {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText2,
          yDefaultTitle: config.yAxisText2,
          placeholder: 990,
          sliderMax: 6000,
          type: 'blank',
        });
      }
    };

    const changeCellSize = (val) => {
      if (config.plotToDraw) {
        this.updatePlotWithChanges({ minCellSize: val.target.value });
      } else {
        this.updatePlotWithChanges({ minCellSize2: val.target.value });
      }
    };
    return (
      <>
        <Row>
          <Col span={13}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={5}>
            <Space direction='vertical'>
              <Tooltip title='The number of unique molecular identifiers (#UMIs) per cell distinguishes real cells (high #UMIs per cell) from empty droplets (low #UMIs per cell). Look for bimodal distribution to set the cut-off.'>
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
            <List
              dataSource={listData}
              size='small'
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Col>

          <Col span={6}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Collapse defaultActiveKey={['filtering-settings']}>
              <Panel header='Filtering Settings' collapsible={!filtering ? 'disabled' : 'header'} key='filtering-settings'>
                <Form.Item label='Min cell size:'>
                  <InputNumber
                    collapsible={!filtering ? 'disabled' : 'header'}
                    onPressEnter={(val) => changeCellSize(val)}
                    placeholder={config.placeholder}
                    step={100}
                  />
                </Form.Item>
                <BandwidthOrBinstep
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                  type={config.type}
                  max={400}
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

export default CellSizeDistribution;
