/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, Space,
  InputNumber,
} from 'antd';
import _ from 'lodash';
import { Vega } from '../../../../../../node_modules/react-vega';
import plot1Pic from '../../../../../../static/media/plot1.png';
import plot2Pic from '../../../../../../static/media/plot2.png';
import plotData from './new_data.json';
import PlotStyling from '../PlotStyling';

const { Panel } = Collapse;

class GenesVsUMIs extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      minCellSize: 10800,
      minCellSize2: 50,
      xAxisText: 'log10 [molecules]',
      yAxisText: 'Frequency',
      xAxisText2: 'log10 [molecule counts]',
      yAxisText2: 'log10 [gene counts]',
      xDefaultTitle: 'log10 [molecules]',
      yDefaultTitle: 'Frequency',
      legendOrientation: 'right',
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
    let legend = null;
    if (config.legendEnabled) {
      legend = [
        {
          fill: 'color',
          orient: config.legendOrientation,
          title: 'Quality',
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
              hover: {
                fill: { value: 'firebrick' },
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
      //  legends: legend,
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

    const changeCellSize = (val) => {
      if (config.plotToDraw) {
        this.updatePlotWithChanges({ minCellSize: val });
      } else {
        this.updatePlotWithChanges({ minCellSize2: val / 5 });
      }
    };
    return (
      <>
        <Row>

          <Col span={14}>
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


          <Col span={6}>
            <Space direction='vertical'>
              <Collapse>
                <Panel header='Filtering Settings' disabled={!filtering}>
                  Min probability:
                  <InputNumber
                    disabled={!filtering}
                    defaultValue={1000}
                    onChange={(val) => changeCellSize(val)}
                  />
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
