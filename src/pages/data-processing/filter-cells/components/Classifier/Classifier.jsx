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

class Classifier extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      minCellSize: 10800,
      minCellSize2: 50,
      xAxisText: '#UMIs in cell',
      yAxisText: '#UMIs * #Cells',
      xAxisText2: 'Cell rank',
      yAxisText2: "#UMI's in cell",
      xDefaultTitle: '#UMIs in cell',
      yDefaultTitle: '#UMIs * #Cells',
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
      description: 'A contour plot example, overlaying a density estimate on scatter plot points.',
      width: 500,
      height: 400,
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
        {
          name: 'resolve',
          value: 'shared',
          bind: { input: 'select', options: ['independent', 'shared'] },
        },
        {
          name: 'counts',
          value: true,
          bind: { input: 'checkbox' },
        },
      ],
      data: [
        {
          name: 'plotData',
          transform: [
            {
              type: 'filter',
              expr: 'datum.size != null && datum.classifierP != null',
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
              x: { expr: "scale('x', datum.size)" },
              y: { expr: "scale('y', datum.classifierP)" },
              bandwidth: { signal: '[bandwidth, bandwidth]' },
              cellSize: 25,
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
          domain: { data: 'plotData', field: 'size' },
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'plotData', field: 'classifierP' },
          range: 'height',
        },
        {
          name: 'color',
          type: 'ordinal',
          domain: {
            data: 'plotData',
            field: 'Origin',
            sort: { order: 'descending' },
          },
          range: 'category',
        },
      ],
      axes: [
        {
          scale: 'x',
          grid: true,
          domain: false,
          orient: 'bottom',
          tickCount: 5,
          title: 'size',
        },
        {
          scale: 'y',
          grid: true,
          domain: false,
          orient: 'left',
          titlePadding: 5,
          title: 'classifierP',
        },
      ],
      legends: [
        { stroke: 'color', symbolType: 'stroke' },
      ],
      marks: [
        {
          name: 'marks',
          type: 'symbol',
          from: { data: 'plotData' },
          encode: {
            update: {
              x: { scale: 'x', field: 'size' },
              y: { scale: 'y', field: 'classifierP' },
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
              resolve: { signal: 'resolve' },
              color: { expr: "scale('color', datum.datum.Origin)" },
            },
          ],
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

          <Col span={13}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={5}>
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

export default Classifier;
