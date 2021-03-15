import React, { useEffect, useState } from 'react';
import {
  Row, Col, Space, Collapse, Select, Button, Skeleton, Spin, Empty, Typography,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import { updatePlotConfig, loadPlotConfig } from '../../../../../redux/actions/componentConfig';
import Header from '../../../../../components/plots/Header';
import { generateSpec } from '../../../../../utils/plotSpecs/generateHeatmapSpec';
import { loadGeneExpression } from '../../../../../redux/actions/genes';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import PlatformError from '../../../../../components/PlatformError';
import Loader from '../../../../../components/Loader';
import populateHeatmapData from '../../../../../components/plots/helpers/populateHeatmapData';
import HeatmapControls from '../../../../../components/plots/styling/heatmap/HeatmapControls';

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

const HeatmapPlot = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const { expression: expressionData } = useSelector((state) => state.genes);
  const { error, loading } = expressionData;
  const cellSets = useSelector((state) => state.cellSets);
  const selectedGenes = useSelector((state) => state.genes.expression.views[plotUuid]?.data) || [];
  const [vegaSpec, setVegaSpec] = useState();

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);
  useEffect(() => {
    if (selectedGenes.length) {
      onGeneEnter(selectedGenes);
    }
  }, []);
  useEffect(() => {
    console.log('in use effect expression data empty - ', _.isEmpty(expressionData), expressionData);
    if (!config || cellSets.loading || _.isEmpty(expressionData) || _.isEmpty(selectedGenes)) {
      return;
    }
    const groupName = cellSets.properties[config.selectedCellSet].name;
    const spec = generateSpec(config, groupName);
    const data = populateHeatmapData(cellSets, config, expressionData, plotUuid);

    const newVegaSpec = {
      ...spec,
      // axes: [...spec.axes, ...getAxes()],
      data: spec.data.map((datum) => ({
        ...datum,
        values: data[datum.name],
      })),
    };
    setVegaSpec(newVegaSpec);
    console.log('vega spec is ', newVegaSpec);
  }, [expressionData, selectedGenes, config]);

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  // const generateVegaData = () => {
  //   // First, find the child nodes in the hirerarchy.
  //   let newCellSets = cellSets.hierarchy
  //     .find((rootNode) => rootNode.key === config.selectedCellSet)
  //     ?.children || [];

  //   // Build up the data source based on the properties. Note that the child nodes
  //   // in the hierarchy are /objects/ with a `key` property, hence the destructuring
  //   // in the function.
  //   newCellSets = newCellSets.map(({ key }) => ({ key, ...cellSets.properties[key] }));

  //   const expression = selectedGenes.map(
  //     (geneName) => ({ ...expressionData[geneName], geneName }),
  //   );

  //   return { cellSets: newCellSets, expression };
  // };

  const onGeneEnter = (value) => {
    const updates = {};

    if (selectedGenes.length >= 53) {
      updates.labelColour = 'transparent';
    } else {
      updates.labelColour = 'black';
    }

    if (value.length === 0) {
      updates.labelColour = 'transparent';
    }

    updates.selectedGenes = value;
    console.log('updates are ', updates);
    dispatch(loadGeneExpression(experimentId, updates.selectedGenes, plotUuid));
  };

  const onCellSetSelect = ({ value }) => {
    updatePlotWithChanges({ selectedCellSet: value });
  };

  const renderPlot = () => {
    if (!config || loading.length > 0 || cellSets.loading) {
      return (<Loader experimentId={experimentId} />);
    }

    if (error) {
      return (
        <PlatformError
          description='Could not load gene expression data.'
          error={error}
          onClick={() => dispatch(loadGeneExpression(experimentId, selectedGenes))}
        />
      );
    }

    if (selectedGenes.length === 0) {
      return (
        <Empty description={(
          <Text>Add some genes to this heatmap to get started.</Text>
        )}
        />
      );
    }
    if (vegaSpec) {
      return <Vega spec={vegaSpec} renderer='canvas' />;
    }
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

  const plotStylingConfig = [
    {
      panelTitle: 'Main Schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Colours',
      controls: ['colourScheme'],
    },
    {
      panelTitle: 'Legend',
      controls: [
        {
          name: 'legend',
          props: {
            option: {
              positions: 'horizontal-vertical',
            },
          },
        },
      ],
    },
  ];

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
            <HeatmapControls
              config={config}
              plotUuid={plotUuid}
              selectedGenes={selectedGenes}
              onGeneEnter={onGeneEnter}
              generateCellSetOptions={generateCellSetOptions}
              onCellSetSelect={onCellSetSelect}
            />
            <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

HeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default HeatmapPlot;
