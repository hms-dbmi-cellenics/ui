import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import categoricalUMAP from './new_categoricalUMAP.json';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourInversion from '../components/ColourInversion';
import AxesDesign from '../components/AxesDesign';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import LabelsDesign from '../components/LabelsDesign';
import { updatePlotConfig, loadPlotConfig } from '../../../redux/actions/plots/index';
import Header from '../components/Header';

const { Panel } = Collapse;

const routes = [
  {
    path: 'index',
    breadcrumbName: 'Experiments',
  },
  {
    path: 'first',
    breadcrumbName: '10x PBMC 3k',
  },
  {
    path: 'second',
    breadcrumbName: 'Plots and tables',
  },
  {
    path: 'third',
    breadcrumbName: 'Categorical Embedding',
  },
];

// TODO: when we want to enable users to create their custom plots, we will need to change this to proper Uuid
const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';

const EmbeddingCategoricalPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const experimentId = '5e959f9c9f4b120771249001';

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const generateSpec = () => {
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

    return {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'A basic scatter plot example depicting automobile statistics.',
      width: config.width,
      height: config.height,
      autosize: { type: 'fit', resize: true },
      background: config.toggleInvert,
      padding: 5,
      data: [{
        name: 'embeddingCategorical',
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
        source: 'embeddingCategorical',
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
          domain: config.umap1Domain,
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: config.umap2Domain,
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
            data: 'embeddingCategorical',
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
          from: { data: 'embeddingCategorical' },
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
          from: { data: 'embeddingCategorical' },
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
  };

  const onUpdate = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const vegaData = { embeddingCategorical: categoricalUMAP };

  if (!config) {
    return (<Skeleton />);
  }

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header plotUuid={plotUuid} experimentId={experimentId} routes={routes} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  <Vega data={vegaData} spec={generateSpec()} renderer='canvas' />
                </center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse accordion defaultActiveKey={['1']}>
            <Panel header='Main Schema' key='2'>
              <DimensionsRangeEditor
                config={config}
                onUpdate={onUpdate}
              />
              <Collapse accordion defaultActiveKey={['1']}>
                <Panel header='Define and Edit Title' key='6'>
                  <TitleDesign
                    config={config}
                    onUpdate={onUpdate}
                  />
                </Panel>
                <Panel header='Font' key='9'>
                  <FontDesign
                    config={config}
                    onUpdate={onUpdate}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Axes and Margins' key='3'>
              <AxesDesign
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
            <Panel header='Colour Inversion' key='4'>
              <ColourInversion
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
            <Panel header='Markers' key='5'>
              <PointDesign
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
            <Panel header='Legend' key='10'>
              <LegendEditor
                onUpdate={onUpdate}
                legendConfig={[
                  {
                    title: '',
                    titleColor: config.masterColour,
                    fill: 'color',
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
                ]}
              />
            </Panel>
            <Panel header='Labels' key='11'>
              <LabelsDesign
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default EmbeddingCategoricalPlot;
