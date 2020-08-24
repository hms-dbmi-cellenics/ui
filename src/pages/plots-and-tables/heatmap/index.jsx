import React, { useEffect } from 'react';
import {
  PageHeader, Row, Col, Space, Collapse, Select, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import _ from 'lodash';
import heatmap from './heatmap.json';
import DimensionsRangeEditor from './components/DimensionsRangeEditor';
import ColourbarDesign from './components/ColourbarDesign';
import LegendEditor from './components/LegendEditorSpecial';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import { updatePlotConfig } from '../../../redux/actions/plots/index';

const { Panel } = Collapse;
const routes = [
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


// TODO: when we want to enable users to create their custom plots, we will need to change this to proper Uuid
const plotUuid = 'heatmapPlotMain';

const HeatmapPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid].config);

  // draw the heatmap with all the data initially
  useEffect(() => {
    updatePlotWithChanges({ selectedData: heatmap.heatmapData });
  }, []);

  const generateSpec = () => {
    let legend = [];
    if (config.legendLocation === 'horizontal') {
      legend = [
        {
          fill: 'color',
          type: 'gradient',
          orient: 'bottom',
          direction: 'horizontal',
          title: ['Intensity'],
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
          gradientLength: {
            signal: 'width',
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
    }
    if (config.legendLocation === 'vertical') {
      legend = [
        {
          fill: 'color',
          type: 'gradient',
          title: ['Intensity'],
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
          gradientLength: {
            signal: 'height / 3',
          },
        },
        {
          fill: 'colorids',
          title: 'Cluster ID',
          type: 'symbol',
          orient: 'right',
          symbolType: 'square',
          symbolSize: { value: 200 },
          direction: 'vertical',
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
        }];
    }
    if (config.legendLocation === 'hide') {
      legend = null;
    }


    return {
      $schema: 'http//s:vega.github.io/schema/vega/v5.json',
      width: config.width,
      height: config.height,
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
          // title: 'Gene',
          labelFont: { value: config.masterFont },
          titleFont: { value: config.masterFont },
        },
      ],

      legends: legend,

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
    };
  };

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const populateData = (value) => {
    const newSelectedData = [];
    config.selectedData = [];
    if (config.selectedGenes.length >= 53 || config.selectedGenes.length === 0) {
      config.labelColour = 'transparent';
    } else {
      config.labelColour = 'black';
    }
    if (config.selectedGenes.length === 0 || value === 'redraw') {
      updatePlotWithChanges({ selectedData: heatmap.heatmapData });
      config.labelColour = 'transparent';

      return 0;
    }
    for (let i = 0; i < heatmap.heatmapData.length; i += 1) {
      const currentGene = heatmap.heatmapData[i].geneName;
      if (config.selectedGenes.includes(currentGene)) {
        newSelectedData.push({
          geneName: currentGene,
          expression: heatmap.heatmapData[i].expression,
        });
      }
    }

    updatePlotWithChanges({ selectedData: newSelectedData });
  };

  const getSortedGenes = () => {
    let i;

    const sortedGenes = [];

    const genes = heatmap.heatmapData;
    const genenames = [...new Set(genes.map((item) => item.geneName))];
    genenames.sort();

    for (i = 0; i < genenames.length; i += 1) {
      const value = genenames[i];
      sortedGenes.push({
        value,
      });
    }

    return sortedGenes;
  };

  return (
    <>
      <Row>
        <Col>
          <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
            <PageHeader
              className='site-page-header'
              title='Edit collection'
              breadcrumb={{ routes }}
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
                  <Vega data={heatmap} spec={generateSpec()} renderer='canvas' />
                </center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']} accordion>
              <Panel header='Filter Genes' key='5'>
                <Select
                  mode='multiple'
                  style={{ width: '100%' }}
                  placeholder='Please select'
                  onChange={(val) => updatePlotWithChanges({ selectedGenes: val })}
                  options={getSortedGenes()}
                />
                <Space>
                  <Button
                    type='primary'
                    config={config}
                    onClick={() => populateData()}
                  >
                    Draw heatmap
                  </Button>
                  <Button
                    type='primary'
                    config={config}
                    onClick={() => populateData('redraw')}
                  >
                    Reset
                  </Button>
                </Space>
              </Panel>
              <Panel header='Main Schema' key='1'>
                <DimensionsRangeEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
                <Collapse defaultActiveKey={['1']} accordion>
                  <Panel header='Define and Edit Title' key='6'>
                    <TitleDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                  <Panel header='Font' key='9'>
                    <FontDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                </Collapse>
              </Panel>
              <Panel header='Colours' key='10'>
                <ColourbarDesign
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Legend' key='11'>
                <LegendEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
            </Collapse>
          </Space>
        </Col>
      </Row>
    </>
  );
};


export default HeatmapPlot;
