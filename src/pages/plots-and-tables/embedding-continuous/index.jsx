import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
// eslint-disable-next-line camelcase
import new_basicUMAP from './new_basicUMAP.json';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourbarDesign from '../components/ColourbarDesign';
import ColourInversion from '../components/ColourInversion';
import LogExpression from './components/LogExpression';
import AxesDesign from '../components/AxesDesign';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
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
    breadcrumbName: 'Continuous Embedding',
  },
];

// TODO: when we want to enable users to create their custom plots, we will need to change this to proper Uuid
const plotUuid = 'embeddingContinuousMain';
const plotType = 'embeddingContinuous';

const EmbeddingContinuousPlot = () => {
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
    }
    if (config.toggleInvert === '#FFFFFF') {
      config.reverseCbar = false;
      config.masterColour = '#000000';
    }

    if (config.toggleAnchor === 'middle') { config.bounceX = -50; }
    if (config.toggleAnchor === 'start') { config.bounceX = 50; }

    return {

      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'A basic scatter plot example depicting gene expression in the context of UMAP.',
      width: config.width,
      height: config.height,
      autosize: { type: 'fit', resize: true },

      background: config.toggleInvert,
      padding: 5,
      data: {
        name: 'embedding',
        // normally log transform would apply without +10 but had to add
        // here to make values positive
        // current gene expression values arent what id expect them to be
        transform: [
          { type: 'formula', as: 'geneExpression', expr: config.logEquation },
          { type: 'formula', as: 'umap1', expr: 'datum.UMAP_1*1' },
          { type: 'formula', as: 'umap2', expr: 'datum.UMAP_2*1' },
        ],
      },
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
          domain: config.umap2Domain,
          range: 'height',
        },
        {
          name: 'color',
          type: 'linear',
          range: { scheme: config.colGradient },
          domain: { data: 'embedding', field: 'geneExpression' },
          reverse: config.reverseCbar,
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
          from: { data: 'embedding' },
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
  };

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };


  if (!config) {
    return (<Skeleton />);
  }


  const vegaData = { embedding: new_basicUMAP };
  return (
    <>
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
          <Collapse accordion>
            <Panel header='Main Schema' key='2'>
              <DimensionsRangeEditor
                config={config}
                onUpdate={updatePlotWithChanges}
              />
              <Collapse accordion>
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
            <Panel header='Axes and Margins' key='3'>
              <AxesDesign

                config={config}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
            <Panel header='Colours' key='10'>
              <ColourbarDesign
                config={config}
                onUpdate={updatePlotWithChanges}
              />
              <Collapse accordion>
                <Panel header='Colour Inversion' key='4'>
                  <ColourInversion
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
                <Panel header='Log Transformation' key='5'>
                  <LogExpression
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Markers' key='11'>
              <PointDesign
                config={config}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onUpdate={updatePlotWithChanges}
                legendConfig={[
                  {
                    fill: 'color',
                    type: 'gradient',
                    title: 'CST3 Expression',
                    gradientLength: 100,
                    labelColor: { value: config.masterColour },
                    titleColor: { value: config.masterColour },
                    labels: {
                      interactive: true,
                      update: {
                        fontSize: { value: 12 },
                        fill: { value: config.masterColour },
                      },

                    },
                  }]}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

export default EmbeddingContinuousPlot;
