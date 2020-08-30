/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourInversion from '../components/ColourInversion';
import AxesDesign from '../components/AxesDesign';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import LabelsDesign from '../components/LabelsDesign';
import { updatePlotConfig, loadPlotConfig } from '../../../redux/actions/plots/index';
import { generateSpec } from '../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import Header from '../components/Header';

import cellSets from './cellSets.json';
import cellCoordinates from './embedding.json';

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
const experimentId = '5e959f9c9f4b120771249001';

const EmbeddingCategoricalPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const generateData = (spec) => {
    const newCellSets = _.map(cellSets, (value, cellSetId) => ({ ...value, cellSetId }));
    spec.data.forEach((datum) => {
      if (datum.name === 'cellSets') {
        datum.values = newCellSets;
      } else if (datum.name === 'embedding') {
        datum.values = cellCoordinates.embedding;
      }
    });
  };

  if (!config) {
    return (<Skeleton />);
  }

  const vegaSpec = generateSpec(config);
  // due to a bug in vega with React with using data with source coming from other data,
  // we have to inject the data in the Vega spec.
  generateData(vegaSpec);

  const onUpdate = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header plotUuid={plotUuid} experimentId={experimentId} routes={routes} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  <Vega spec={vegaSpec} renderer='canvas' />
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
                    fill: 'cellSetColors',
                    title: 'Cluster ID',
                    type: 'symbol',
                    orient: 'top',
                    offset: 40,
                    symbolType: 'square',
                    symbolSize: { value: 200 },
                    encode: {
                      labels: {
                        update: { text: { scale: 'cellSetIDToName', field: 'label' } },
                      },
                    },
                    direction: 'horizontal',
                    labelFont: { value: 'sans-serif' },
                    titleFont: { value: 'sans-serif' },
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
