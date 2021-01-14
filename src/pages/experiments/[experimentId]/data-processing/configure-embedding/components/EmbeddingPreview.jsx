/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react';

import {
  Row, Col, Space, Button, Tooltip,
  Collapse, PageHeader,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../../../../static/media/plot9.png';
import plot2Pic from '../../../../../../../static/media/plot10.png';
import PlotStyling from '../../filter-cells/components/PlotStyling';
import EmbeddingConfig from './EmbeddingConfig';
import UMAP from './new_data.json';

class EmbeddingPreview extends React.Component {
  constructor(props) {
    super(props);

    this.routes = [
      {
        path: 'index',
        breadcrumbName: 'Experiments',
      },
      {
        path: 'first',
        breadcrumbName: 'TGFB1 CABG study',
      },
      {
        path: 'second',
        breadcrumbName: 'Plots and tables',
      },
      {
        path: 'third',
        breadcrumbName: 'Disease vs. control (Differential expression)',
      },
    ];

    this.defaultConfig = {
      width: 600,
      height: 500,
      pointSize: 5,
      toggleInvert: '#FFFFFF',
      masterColour: '#000000',
      umap1Domain: null,
      umap2Domain: null,
      plotToDraw: true,
      titleText: '',
      titleSize: 20,
      titleAnchor: 'start',
      axisTitlesize: 13,
      axisTicks: 13,
      transGrid: 0,
      axesOffset: 10,
      masterFont: 'sans-serif',
      xAxisText: '',
      yAxisText: '',
      xAxisText2: '',
      yAxisText2: '',
      pointStyle: 'circle',
      pointOpa: 5,
      g1Color: 'red',
      g2mColor: 'green',
      sColor: 'blue',
      legendTextColor: '#FFFFFF',
      legendEnabled: true,
      legend: null,
      legendPosition: 'top-right',
      geneexpLegendloc: '',
      colGradient: 'spectral',
      labelSize: 28,
      labelShow: 1,
      labelFont: 2,
      labelsEnabled: true,
      reverseCbar: false,
      selectedClusters: [],
      testVar: null,
      bounceX: 0,
      plotTitle: 'default clusters',
      maxHeight: 600,
      maxWidth: 700,
    };

    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: UMAP,
    };

    this.updatePlotWithChanges = this.updatePlotWithChanges.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  generateSpec() {
    const { config } = this.state;

    if (config.toggleInvert === '#000000') {
      config.reverseCbar = true;
      config.masterColour = '#FFFFFF';
      config.legendTextColor = '#FFFFFF';
    }
    if (config.toggleInvert === '#FFFFFF') {
      config.reverseCbar = false;
      config.masterColour = '#000000';
      config.legendTextColor = '#000000';
    }

    if (config.labelsEnabled) {
      config.labelShow = 1;
    } else {
      config.labelShow = 0;
    }

    if (config.legendEnabled) {
      config.legend = [
        {
          title: '',
          titleColor: config.masterColour,
          fill: 'color',
          orient: config.legendPosition,
          rowPadding: 5,
          symbolSize: 200,

          encode: {
            title: {
              update: {
                fontSize: { value: 14 },
              },
            },
            labels: {
              interactive: true,
              update: {
                fontSize: { value: 17 },
                fill: { value: config.legendTextColor },
              },

            },
          },
        },
      ];
    } else {
      config.legend = null;
    }
    if (config.plotToDraw) {
      return {
        width: config.width || this.defaultConfig.width,
        height: config.height || this.defaultConfig.height,
        autosize: { type: 'fit', resize: true },

        background: config.toggleInvert,
        padding: 5,
        data: [{
          name: 'embeddingCat',
          transform: [{
            type: 'joinaggregate',
            groupby: ['cluster_id'],
            fields: ['UMAP_1', 'UMAP_2'],
            ops: ['mean', 'mean'],
            as: ['um1', 'um2'],
          }],
        },

        {
          name: 'cluster_labels',
          source: 'embeddingCat',
          transform: [{
            type: 'joinaggregate',
            fields: ['UMAP_1', 'UMAP_2'],
            ops: ['mean', 'mean'],
            as: ['um1', 'um2'],
          }],
        }],

        scales: [
          {
            name: 'x',
            type: 'linear',
            round: true,
            nice: true,
            domain: { data: 'embeddingCat', field: 'UMAP_1' },
            range: 'width',
          },
          {
            name: 'y',
            type: 'linear',
            round: true,
            nice: true,
            zero: true,
            domain: { data: 'embeddingCat', field: 'UMAP_2' },
            range: 'height',
          },
          {
            name: 'color',
            type: 'ordinal',
            range:
              [
                'red', 'green', 'blue', 'teal', 'orange', 'purple', 'cyan', 'magenta',
              ],
            domain: {
              data: 'embeddingCat',
              field: 'cluster_id',
              sort: true,
            },

          },
        ],

        axes: [
          {
            scale: 'x',
            grid: true,
            domain: true,
            orient: 'bottom',
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
            domain: true,
            orient: 'left',
            titlePadding: 5,
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
            type: 'symbol',
            from: { data: 'embeddingCat' },
            encode: {
              enter: {
                x: { scale: 'x', field: 'UMAP_1' },
                y: { scale: 'y', field: 'UMAP_2' },
                size: { value: config.pointSize },
                stroke: {
                  scale: 'color',
                  field: 'cluster_id',
                },
                fill: {
                  scale: 'color',
                  field: 'cluster_id',
                },
                shape: { value: config.pointStyle },
                fillOpacity: { value: config.pointOpa / 10 },
              },
            },
          },
          {
            type: 'text',
            from: { data: 'embeddingCat' },
            encode: {
              enter: {
                x: { scale: 'x', field: 'um1' },
                y: { scale: 'y', field: 'um2' },

                text: {
                  field: 'cluster_id',

                },

                fontSize: { value: config.labelSize },
                strokeWidth: { value: 1.2 },
                fill: { value: config.masterColour },
                fillOpacity: { value: config.labelShow },
                font: { value: config.masterFont },

              },
              transform: [
                { type: 'label', size: ['width', 'height'] }],
            },
          },
        ],

        legends: config.legend,

        title:
        {
          text: { value: config.titleText },
          color: { value: config.masterColour },
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

      background: config.toggleInvert,
      padding: 5,
      data: {
        name: 'embeddingCat',
        transform: [{
          type: 'filter',
          expr: "datum.doubletScore !== 'NA'",
        },
        { type: 'formula', as: 'geneExpression', expr: 'datum.doubletScore*1' },
        { type: 'formula', as: 'umap1', expr: 'datum.UMAP_1*1' },
        { type: 'formula', as: 'umap2', expr: 'datum.UMAP_2*1' }],
      },
      scales: [
        {
          name: 'x',
          type: 'linear',
          round: true,
          nice: true,
          domain: { data: 'embeddingCat', field: 'UMAP_1' },
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          domain: { data: 'embeddingCat', field: 'UMAP_2' },
          range: 'height',
        },
        {
          name: 'color',
          type: 'linear',
          range: { scheme: config.colGradient },
          domain: { data: 'embeddingCat', field: 'geneExpression' },
          reverse: config.reverseCbar,
        },

      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: true,
          orient: 'bottom',
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
          domain: true,
          orient: 'left',
          titlePadding: 5,
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
          type: 'symbol',
          from: { data: 'embeddingCat' },
          encode: {
            enter: {
              x: { scale: 'x', field: 'umap1' },
              y: { scale: 'y', field: 'umap2' },
              size: { value: config.pointSize },
              stroke: {
                scale: 'color',
                field: 'geneExpression',
              },
              fill: {
                scale: 'color',
                field: 'geneExpression',
              },
              shape: { value: config.pointStyle },
              fillOpacity: { value: config.pointOpa / 10 },
            },
          },
        },

      ],
      legends: config.legend,
      title:
      {
        text: { value: config.titleText },
        color: { value: config.masterColour },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
        dx: { value: config.bounceX },
        fontSize: { value: config.titleSize },
      },
    };
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

  changePlot(val) {
    this.updatePlotWithChanges({ plotToDraw: val });
    if (val) {
      this.updatePlotWithChanges({ plotTitle: 'default clusters' });
    } else {
      this.updatePlotWithChanges({ plotTitle: 'cell doublet score' });
    }
  }

  render() {
    const { config } = this.state;

    const data = { embeddingCat: this.generateData() };

    return (
      <>
        <PageHeader
          title={`Embedding preview (${config.plotTitle})`}
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
        />
        <Row>
          <Col span={15}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={3}>
            <Space direction='vertical'>
              <Tooltip title='The number of dimensions used to configure the embedding is set here. This dictates the number of clusters in the Uniform Manifold Approximation and Projection (UMAP) which is taken forward to the ‘data exploration’ page.'>
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
                onClick={() => this.changePlot(true)}
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
                onClick={() => this.changePlot(false)}
              />
            </Space>
          </Col>

          <Col span={5}>
            <EmbeddingConfig />
            <PlotStyling
              config={config}
              onUpdate={this.updatePlotWithChanges}
              updatePlotWithChanges={this.updatePlotWithChanges}
              legendMenu
            />
          </Col>
        </Row>
      </>
    );
  }
}

export default EmbeddingPreview;
