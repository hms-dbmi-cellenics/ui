import React from 'react';

import {
  PageHeader, Row, Col, Space, Collapse, Select, Typography, Divider, Button,
} from 'antd';

import { Vega } from 'react-vega';

import _ from 'lodash';

import heatmap from './heatmap.json';
import DimensionsRangeEditor from './components/DimensionsRangeEditor';
import ColourbarDesign from './components/ColourbarDesign';
import LegendEditor from '../components/LegendEditor';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
const { Panel } = Collapse;
const { Title } = Typography;


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
      width: 500,
      height: 500,
      colGradient: 'viridis',
      legend: null,
      legendEnabled: false,
      selectedGenes: [],
      selectedData: heatmap.heatmapData,
      masterFont: 'sans-serif',
      titleText: '',
      titleSize: 20,
      titleAnchor: 'start',
      bounceX: 0,
      masterColour: '#000000',
      labelColour: 'transparent',
      masterFont: 'sans-serif',
    };

    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: heatmap,
    };
    this.updatePlotWithChanges = this.updatePlotWithChanges.bind(this);
  }

  generateSpec() {
    const { config } = this.state;
    if (config.legendEnabled) {
      config.legend = [
        {
          fill: 'color',
          type: 'gradient',
          title: ['Normalised', 'Expression'],
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
          gradientLength: {
            signal: 'height/2',
          },
        },

        {
          fill: 'colorids',
          title: 'Cluster ID',
          type: 'symbol',
          orient: 'top',
          offset: 40,
          symbolType: 'square',
          symbolSize: { value: 200 },
          direction: 'horizontal',
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
        }];
    } else {
      config.legend = null;
    }


    return {
      $schema: 'http//s:vega.github.io/schema/vega/v5.json',
      width: config.width || defaultConfig.width,
      height: config.height || defaultConfig.height,
      autosize: { type: 'fit', resize: true },
      data: [
        {
          name: 'cellNames',
          values: heatmap.cellNames,
          copy: true,
          transform: [
            {
              type: 'identifier',
              as: 'cellIndex',
            },
            {
              type: 'formula',
              as: 'cellIndex',
              expr: 'datum.cellIndex-1',
            },
          ],
        },
        {
          name: 'clusterIds',
          values: heatmap.categories,
          copy: true,
          transform: [
            {
              type: 'flatten',
              fields: ['values'],
              as: ['cluster'],
            },
            {
              type: 'window',
              ops: ['row_number'],
              as: ['cellIndex'],
            },
            {
              type: 'formula',
              as: 'cellIndex',
              expr: 'datum.cellIndex-1',
            },
            {
              type: 'lookup',
              from: 'cellNames',
              key: 'cellIndex',
              fields: ['cellIndex'],
              values: ['data'],
              as: ['cellName'],
            },
            {
              type: 'collect',
              sort: { field: 'cluster' },
            },
          ],
        },
        {
          name: 'heatmapData',
          values: config.selectedData,
          copy: true,
          transform: [
            {
              type: 'flatten',
              fields: ['expression'],
              index: 'cellIndex',
            },
            {
              type: 'lookup',
              from: 'cellNames',
              key: 'cellIndex',
              fields: ['cellIndex'],
              values: ['data'],
              as: ['cellName'],
            },
          ],
        },
      ],

      scales: [
        {
          name: 'x',
          type: 'band',
          domain: {
            data: 'clusterIds',
            field: 'cellName',
          },
          range: 'width',
        },
        {
          name: 'y',
          type: 'band',
          domain: {
            data: 'heatmapData',
            field: 'geneName',
          },
          range: 'height',
        },
        {
          name: 'color',
          type: 'linear',
          range: {
            scheme: config.colGradient,
          },
          domain: {
            data: 'heatmapData',
            field: 'expression',
          },
          zero: false,
          nice: true,
        },
        {
          name: 'colorids',
          type: 'ordinal',
          range: [
            'red', 'green', 'blue', 'teal', 'orange', 'purple', 'cyan', 'magenta',
          ],

          domain: {
            data: 'clusterIds',
            field: 'cluster',
            sort: true,
          },
        },
      ],
      axes: [
        {
          from: { data: 'heatmapData' },
          orient: 'left',
          scale: 'y',
          labelColor: config.labelColour,
          domain: false,
          title: 'Gene',
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
        },
      ],

      legends: config.legend,

      marks: [
        {
          type: 'rect',
          from: {
            data: 'heatmapData',
          },
          encode: {
            enter: {
              x: {
                scale: 'x',
                field: 'cellName',
              },
              y: {
                scale: 'y',
                field: 'geneName',
              },
              width: {
                scale: 'x',
                band: 1,
              },
              height: {
                scale: 'y',
                band: 1,
              },
            },
            update: {
              fill: {
                scale: 'color',
                field: 'expression',
              },
            },
          },
        },
        {
          type: 'rect',
          from: {
            data: 'clusterIds',
          },
          encode: {
            enter: {
              x: {
                scale: 'x',
                field: 'cellName',
              },
              y: { value: -30 },
              width: {
                scale: 'x',
                band: 1,
              },
              height: {
                value: 20,
              },
            },
            update: {
              fill: {
                scale: 'colorids',
                field: 'cluster',
                opacity: { value: 1 },
              },
              stroke: {
                scale: 'colorids',
                field: 'cluster',
                opacity: { value: 1 },
              },
            },
          },
        },
      ],
      title:
      {
        text: { value: config.titleText },
        color: { value: config.masterColour },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
        dx: { value: config.bounceX },
        fontSize: { value: config.titleSize },
      },
    }
  };

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

  populateData(value) {
    const { config } = this.state;
    const newSelectedData = [];
    config.selectedData = [];
    if (config.selectedGenes.length >= 53 || config.selectedGenes.length == 0) {
      config.labelColour = 'transparent';
    }
    else {
      config.labelColour = 'black';
    }
    if (config.selectedGenes.length == 0) {
      this.updatePlotWithChanges({ selectedData: heatmap.heatmapData });
      return 0;
    }
    for (let i = 0; i < heatmap.heatmapData.length; i++) {
      const current_gene = heatmap.heatmapData[i].geneName;
      if (config.selectedGenes.includes(current_gene)) {
        newSelectedData.push({
          geneName: current_gene,
          expression: heatmap.heatmapData[i].expression,
        });
      }
    }

    this.updatePlotWithChanges({ selectedData: newSelectedData });
  }

  handleChange(value) {
    this.state.config.selectedGenes = [];
    this.state.config.selectedGenes = value;
  }

  render() {
    const { config } = this.state;
    const data = { heatmap: this.generateData() };
    const options = [];
    let i;

    for (i = 0; i < heatmap.heatmapData.length; i++) {
      const value = heatmap.heatmapData[i].geneName;
      options.push({
        value,
      });
    }

    return (
      <>
        <Row>
          <Col>
            <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
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
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header='Main Schema' key='1'>
                  <Collapse defaultActiveKey={['1']}>
                    <DimensionsRangeEditor
                      config={config}
                      onUpdate={this.updatePlotWithChanges}
                    />
                  </Collapse>

                  <Collapse defaultActiveKey={['1']}>
                    <Panel header='Define and Edit Title' key='6'>
                      <TitleDesign
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>
                  </Collapse>
                  <Collapse>
                    <Panel header='Font' key='9'>
                      <FontDesign
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>
                  </Collapse>
                </Panel>

                <Panel header='Colours' key='10'>
                  <ColourbarDesign
                    config={config}
                    onUpdate={this.updatePlotWithChanges}
                  />
                </Panel>
                <Collapse>
                  <Panel header='Legend' key='5'>
                    <LegendEditor
                      config={config}
                      onUpdate={this.updatePlotWithChanges}
                    />
                  </Panel>
                </Collapse>
                <Panel header='Filter Genes' key='5'>
                  <Title level={4}>
                    {options.length}
                    {' '}
                    Genes
                  </Title>

                  <Select
                    mode='multiple'
                    style={{ width: '100%' }}
                    placeholder='Please select'
                    onChange={(val) => this.handleChange(val)}
                    options={options}
                  />
                  <Button
                    type='primary'
                    config={config}
                    onClick={() => this.populateData()}
                  >
                    Draw heatmap
                  </Button>
                </Panel>
              </Collapse>
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}


export default PlotsAndTablesViewPage;
