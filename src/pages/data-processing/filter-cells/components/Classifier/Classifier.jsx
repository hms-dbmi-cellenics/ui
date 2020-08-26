/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, Space,
  InputNumber, Form,
} from 'antd';
import _ from 'lodash';
import { Vega } from '../../../../../../node_modules/react-vega';
import plotData from './new_data.json';
import PlotStyling from '../PlotStyling';

const { Panel } = Collapse;

class Classifier extends React.Component {
  constructor(props) {
    super(props);

    this.defaultConfig = {
      data: plotData,
      xAxisText: 'log10[ cell size (UMIs) ]',
      yAxisText: 'classifier prob',
      xDefaultTitle: 'log10[ cell size (UMIs) ]',
      yDefaultTitle: 'classifier probability',
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
      minProbability: 0.82,
      axisTitlesize: 13,
      axisTicks: 13,
      axisOffset: 0,
      transGrid: 10,
      width: 630,
      height: 500,
      maxWidth: 789,
      maxHeight: 560,
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
              levels: 10,
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
          domainMin: 1.5,
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
              resolve: 'independent',
              color: '#1361a8',
            },
          ],
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: { value: 0 },
              x2: { field: { group: 'width' } },
              y: { scale: 'y', value: config.minProbability, round: true },
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
    const minProbabilityChange = (val) => {
      this.updatePlotWithChanges({ minProbability: val.target.value });
    };
    return (
      <>
        <Row>

          <Col span={18}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>
          <Col span={6}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Filtering Settings' disabled={!filtering} key='1'>
                <Form.Item label='Min probability:'>
                  <InputNumber
                    disabled={!filtering}
                    defaultValue={0.82}
                    max={1}
                    min={0}
                    onPressEnter={(val) => minProbabilityChange(val)}
                    step={0.1}
                  />
                </Form.Item>
              </Panel>
              <PlotStyling
                config={config}
                onUpdate={this.updatePlotWithChanges}
                updatePlotWithChanges={this.updatePlotWithChanges}
                singlePlot
              />
            </Collapse>
          </Col>
        </Row>
      </>
    );
  }
}

export default Classifier;
