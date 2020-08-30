import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Select, Button, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import _ from 'lodash';
import cellSets from './cellSets.json';
import expression from './expression.json';

import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourbarDesign from '../components/ColourbarDesign';
import LegendEditorSpecial from './components/LegendEditorSpecial';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import { updatePlotConfig, loadPlotConfig } from '../../../redux/actions/plots/index';
import Header from '../components/Header';

import generateSpec from '../../../utils/plotSpecs/generateHeatmapSpec';

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
    breadcrumbName: 'Heatmap',
  },
];

// TODO: when we want to enable users to create their custom plots, we will need to change this to proper Uuid
const plotUuid = 'heatmapPlotMain';
const plotType = 'heatmap';

const HeatmapPlot = () => {
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

  const onDisplayedGenesSelect = (value) => {
    if (config.selectedGenes.length >= 53 || config.selectedGenes.length === 0) {
      updatePlotWithChanges({ labelColour: 'transparent' });
    } else {
      updatePlotWithChanges({ labelColour: 'black' });
    }

    if (config.selectedGenes.length === 0 || value === 'redraw') {
      updatePlotWithChanges({ labelColour: 'transparent' });
      return 0;
    }
  };

  const getSortedGenes = () => {
    const sortedGenes = Object.keys(expression);

    return sortedGenes.map((value) => ({ value }));
  };

  const generateVegaData = () => {
    const newCellSets = _.map(cellSets, (value, cellSetId) => ({ ...value, cellSetId }));
    const newExpression = _.map(expression, (value, geneName) => ({ ...value, geneName }));

    return { cellSets: newCellSets, expression: newExpression };
  };


  if (!config) {
    return (<Skeleton />);
  }

  return (
    <>
      <Header plotUuid={plotUuid} experimentId={experimentId} routes={routes} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  <Vega spec={generateSpec(config)} data={generateVegaData()} renderer='canvas' />
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
                    onClick={() => onDisplayedGenesSelect()}
                  >
                    Draw heatmap
                  </Button>
                  <Button
                    type='primary'
                    config={config}
                    onClick={() => onDisplayedGenesSelect('redraw')}
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
                <LegendEditorSpecial
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
