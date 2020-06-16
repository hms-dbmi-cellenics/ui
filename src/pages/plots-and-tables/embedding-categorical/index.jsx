import React from 'react';

import {
  PageHeader, Row, Col, Space, Collapse,
} from 'antd';

import { Vega } from 'react-vega';

import _ from 'lodash';
import categoricalUMAP from './new_categoricalUMAP.json';

import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourInversion from './components/ColourInversion';

import AxesDesign from '../components/AxesDesign';
import PointDesign from './components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import LabelsDesign from './components/LabelsDesign';
const { Panel } = Collapse;

// eslint-disable-next-line react/prefer-stateless-function
class PlotsAndTablesViewPage extends React.Component {
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
      width: 750,
      height: 600,
      pointSize: 5,
      toggleInvert: '#FFFFFF',
      masterColour: '#000000',
      umap1Domain: null,
      umap2Domain: null,

      titleText: '',
      titleSize: 20,
      titleAnchor: 'start',
      axisTitlesize: 13,
      axisTicks: 13,
      transGrid: 0,
      axesOffset: 10,
      masterFont: 'sans-serif',
      xaxisText: 'UMAP 1',
      yaxisText: 'UMAP 2',
      pointStyle: 'circle',
      pointOpa: 5,
      g1Color: 'red',
      g2mColor: 'green',
      sColor: 'blue',
      legendTextColor: '#FFFFFF',
      legendEnabled: null,
      legend: null,

      labelSize: 28,
      labelShow: 1,
      labelFont: 2,
      labelsEnabled: true,
      labelFill: "white",
      labelOutline: "black",
    };

    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: categoricalUMAP,
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
    if (config.legendEnabled) {
      config.legend = [
        {
          title: '',
          titleColor: config.masterColour,
          fill: 'color',
          rowPadding: 20,
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

    if (config.labelsEnabled) {
      config.labelFill = 'white';
      config.labelOutline = 'black';
    }
    else {
      config.labelFill = 'transparent';
      config.labelOutline = 'transparent';
    }

    const UMAP1Domain = config.umap1Domain
      ? [config.umap1Domain]
      : { data: 'embeddingCat', field: 'UMAP_1' };

    const UMAP2Domain = config.umap2Domain
      ? [config.umap2Domain]
      : { data: 'embeddingCat', field: 'UMAP_2' };


    return {

      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'A basic scatter plot example depicting automobile statistics.',
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
          domain: UMAP1Domain,
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: UMAP2Domain,
          range: 'height',

        },
        {
          name: 'color',
          type: 'ordinal',
          range:
            [
              'red', 'green', 'blue', 'teal', 'orange', 'purple', 'cyan', 'magenta'
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
          title: { value: config.xaxisText },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          labelColor: { value: config.masterColour },
          tickColor: { value: config.masterColour },
          gridColor: { value: config.masterColour },
          gridOpacity: { value: (config.transGrid / 20) },
          gridWidth: { value: (config.widthGrid / 20) },
          offset: { value: config.axesOffset },
          titleFontSize: { value: config.axisTitlesize },
          titleColor: { value: config.masterColour },
          labelFontSize: { value: config.axisTicks },
          domainWidth: { value: config.lineWidth },
        },
        {
          scale: 'y',
          grid: true,
          domain: true,
          orient: 'left',
          titlePadding: 5,
          gridColor: { value: config.masterColour },
          gridOpacity: { value: (config.transGrid / 20) },
          gridWidth: { value: (config.widthGrid / 20) },
          tickColor: { value: config.masterColour },
          offset: { value: config.axesOffset },
          title: { value: config.yaxisText },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          labelColor: { value: config.masterColour },
          titleFontSize: { value: config.axisTitlesize },
          titleColor: { value: config.masterColour },
          labelFontSize: { value: config.axisTicks },
          domainWidth: { value: config.lineWidth },
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
              stroke: { value: config.labelOutline },
              strokeWidth: { value: 1.2 },
              fill: { value: config.labelFill },
              fillOpacity: { value: config.labelShow },

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

  render() {
    const { config } = this.state;

    const data = { embeddingCat: this.generateData() };

    return (
      <>
        <Row>
          <Col>
            <div style={{ 'padding-top': '12px', 'padding-bottom': '12px' }}>
              <PageHeader
                className='site-page-header'
                title='Edit collection'
                breadcrumb={{ routes: this.routes }}
                subTitle='Customize plots and tables in this collection'
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header='Preview' key='1'>
                  <center>
                    <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
                  </center>
                </Panel>
              </Collapse>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Main Schema' key='2'>
                <DimensionsRangeEditor
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                />
                <Collapse defaultActiveKey={['1']}>
                  <Panel header='Define and Edit Title' key='6'>
                    <TitleDesign
                      config={config}
                      onUpdate={this.updatePlotWithChanges}
                    />
                  </Panel>
                  <Panel header='Font' key='9'>
                    <FontDesign
                      config={config}
                      onUpdate={this.updatePlotWithChanges}
                    />
                  </Panel>
                </Collapse>
              </Panel>

              <Panel header='Axes and Margins' key='3'>
                <AxesDesign

                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                />
              </Panel>
            </Collapse>
            <Collapse defaultActiveKey={['1']}>

              <Collapse defaultActiveKey={['1']}>
                <Panel header='Colour Inversion' key='4'>
                  <ColourInversion
                    config={config}
                    onUpdate={this.updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Collapse>


            <Collapse>
              <Panel header='Markers' key='5'>
                <PointDesign
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                />
              </Panel>
            </Collapse>
            <Collapse defaultActiveKey={['1']}>

              <Panel header='Legend' key='10'>
                <LegendEditor
                  color={config.legendTextColor}
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                />
              </Panel>

            </Collapse>
            <Collapse defaultActiveKey={['1']}>

              <Panel header='Labels' key='10'>
                <LabelsDesign
                  color={config.legendTextColor}
                  config={config}
                  onUpdate={this.updatePlotWithChanges}
                />
              </Panel>

            </Collapse>
          </Col>


        </Row>
      </>
    );
  }
}

export default PlotsAndTablesViewPage;
