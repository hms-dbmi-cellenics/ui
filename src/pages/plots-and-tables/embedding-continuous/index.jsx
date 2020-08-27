import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import data from './gene_expression.json';
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
import { generateSpec } from '../../../utils/plotSpecs/generateEmbeddingSpec';
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

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const generateData = (spec) => {
    spec.data.forEach((datum) => {
      // eslint-disable-next-line no-param-reassign
      datum.values = data[datum.name];
    });
  };

  if (!config) {
    return (<Skeleton />);
  }

  const spec = generateSpec(config);
  generateData(spec);

  return (
    <>
      <Header plotUuid={plotUuid} experimentId={experimentId} routes={routes} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  <Vega spec={spec} renderer='canvas' />
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
                    // todo: make this more generic when the plot starts using real data
                    title: 'Gene Expression',
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
