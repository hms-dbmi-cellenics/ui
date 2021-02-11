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
import PlotStyling from '../../../../../../../components/plotStyling';
import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

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
      bandwidth: -1,
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
              bandwidth: [config.bandwidth, config.bandwidth],
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
              y: { scale: 'y', value: config.minProbability, round: false },
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
      this.updatePlotWithChanges({ minProbability: val });
    };
    return (
      <>
        <Row>

          <Col span={17}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />

          </Col>
          <Col span={1}>
            <Tooltip placement='bottom' title='The classifier combines several properties (mitochondrial content, entropy, etc.) into a single probability score and is used to refine the filtering of empty droplets. The cut-off is typically set around 0.6-0.9.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>
          </Col>
          <Col span={6}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Collapse defaultActiveKey={['filtering-settings']}>
              <Panel header='Filtering Settings' collapsible={!filtering ? 'disabled' : 'header'} key='filtering-settings'>
                <Form.Item label='Min probability:'>
                  <Slider
                    defaultValue={0.82}
                    min={0}
                    max={1}
                    onAfterChange={(val) => minProbabilityChange(val)}
                    step={0.05}
                  />
                </Form.Item>
                <BandwidthOrBinstep
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                  type='bandwidth'
                />
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
