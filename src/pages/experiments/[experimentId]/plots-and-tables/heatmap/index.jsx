import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Select, Button, Skeleton, Spin, Empty, Typography,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';

import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourbarDesign from '../components/ColourbarDesign';
import LegendEditorSpecial from './components/LegendEditorSpecial';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import { updatePlotConfig, loadPlotConfig } from '../../../../../redux/actions/plots/index';
import Header from '../components/Header';
import generateSpec from '../../../../../utils/plotSpecs/generateHeatmapSpec';
import { loadGeneExpression } from '../../../../../redux/actions/genes';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import isBrowser from '../../../../../utils/environment';
import PlatformError from '../../../../../components/PlatformError';

const { Text } = Typography;
const { Panel } = Collapse;

const route = {
  path: 'heatmap',
  breadcrumbName: 'Heatmap',
};

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'heatmapPlotMain';
const plotType = 'heatmap';

const HeatmapPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const { loading, error, data: expressionData } = useSelector((state) => state.genes.expression);
  const cellSets = useSelector((state) => state.cellSets);

  const router = useRouter();
  const { experimentId } = router.query;

  useEffect(() => {
    if (!isBrowser) return;

    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);

  useEffect(() => {
    if (!config || config.selectedGenes?.length === 0) return;

    dispatch(loadGeneExpression(experimentId, config.selectedGenes));
  }, [config]);

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const generateVegaData = () => {
    // First, find the child nodes in the hirerarchy.
    let newCellSets = cellSets.hierarchy
      .find((rootNode) => rootNode.key === config.selectedCellSet)
      ?.children || [];

    // Build up the data source based on the properties. Note that the child nodes
    // in the hierarchy are /objects/ with a `key` property, hence the destructuring
    // in the function.
    newCellSets = newCellSets.map(({ key }) => ({ key, ...cellSets.properties[key] }));

    const expression = config.selectedGenes.map(
      (geneName) => ({ ...expressionData[geneName], geneName }),
    );

    return { cellSets: newCellSets, expression };
  };

  const onGeneEnter = (value) => {
    const updates = {};

    if (config.selectedGenes.length >= 53) {
      updates.labelColour = 'transparent';
    } else {
      updates.labelColour = 'black';
    }

    if (value.length === 0) {
      updates.labelColour = 'transparent';
    }

    updates.selectedGenes = value;

    updatePlotWithChanges(updates);
  };

  const onCellSetSelect = ({ value }) => {
    updatePlotWithChanges({ selectedCellSet: value });
  };

  const renderPlot = () => {
    if (!config || loading.length > 0 || cellSets.loading) {
      return (<Spin />);
    }

    if (error) {
      return (
        <PlatformError
          description='Could not load gene expression data.'
          onClick={() => dispatch(loadGeneExpression(experimentId, config.selectedGenes))}
        />
      );
    }

    if (config.selectedGenes.length === 0) {
      return (
        <Empty description={(
          <>
            <p>
              <Text>Add some genes to this heatmap to get started.</Text>
            </p>
          </>
        )}
        />
      );
    }

    const groupName = cellSets.properties[config.selectedCellSet].name;

    return <Vega spec={generateSpec(config, groupName)} data={generateVegaData()} renderer='canvas' />;
  };

  const generateCellSetOptions = () => {
    const hierarchy = cellSets.hierarchy.map(
      (cellSet) => ({ key: cellSet.key, children: cellSet.children?.length || 0 }),
    );

    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  if (!config || cellSets.loading) {
    return (<Skeleton />);
  }

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>

      <Header plotUuid={plotUuid} experimentId={experimentId} finalRoute={route} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  {renderPlot()}
                </center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['5']} accordion>
              <Panel header='Add genes' key='5'>
                <p>Type in a gene name and hit space or enter to add it to the heatmap.</p>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <Select
                    mode='tags'
                    style={{ width: '100%' }}
                    placeholder='Select genes...'
                    onChange={onGeneEnter}
                    value={config.selectedGenes}
                    tokenSeparators={[' ']}
                    notFoundContent='No gene added yet.'
                  />
                  <Button
                    type='primary'
                    onClick={() => onGeneEnter([])}
                  >
                    Reset
                  </Button>
                </Space>
              </Panel>
              <Panel header='Group by' key='6'>
                <p>Select the cell set category you would like to group cells by.</p>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <Select
                    labelInValue
                    style={{ width: '100%' }}
                    placeholder='Select cell set...'
                    value={{ key: config.selectedCellSet }}
                    options={generateCellSetOptions()}
                    onChange={onCellSetSelect}
                  />
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
    </div>
  );
};

export default HeatmapPlot;
