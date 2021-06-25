import React, { useEffect, useState, useRef } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton, Empty, Typography,
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
  const displaySavedGenes = useRef(true);
  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);
  useEffect(() => {
    if (!config || _.isEmpty(expressionData)) {
      return;
    }

    if (!_.isEqual(selectedGenes, config.selectedGenes) && displaySavedGenes.current) {
      onGeneEnter(config.selectedGenes);
      displaySavedGenes.current = false;
    }
  }, [config]);

  useEffect(() => {
    if (!config || _.isEmpty(expressionData)) {
      return;
    }

    if (!_.isEqual(selectedGenes, config.selectedGenes) && !_.isEmpty(selectedGenes)) {
      updatePlotWithChanges({ selectedGenes });
    }
  }, [selectedGenes]);

  useEffect(() => {
    if (!config || cellSets.loading || _.isEmpty(expressionData) || _.isEmpty(selectedGenes) || !loading) {
      return;
    }

    const spec = generateSpec(config, 'Cluster ID');
    const data = populateHeatmapData(cellSets, config, expressionData, selectedGenes);

    const newVegaSpec = {
      ...spec,
      axes: [...spec.axes, ...displayLabels()],
      data: spec.data.map((datum) => ({
        ...datum,
        values: data[datum.name],
      })),
    };
    setVegaSpec(newVegaSpec);
  }, [expressionData, config, cellSets]);

  const displayLabels = () => {
    // if there are more than 53 genes - do not display the labels axe
    const labels = [
      {
        domain: false,
        orient: 'left',
        scale: 'y',
      },
    ];
    if (selectedGenes.length <= 53) {
      return labels;
    }
    return [];
  };

  // updatedField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updatedField) => {
    dispatch(updatePlotConfig(plotUuid, updatedField));
  };

  const onGeneEnter = (genes) => {
    // updating the selected genes in the config too so they are saved in dynamodb

    dispatch(loadGeneExpression(experimentId, genes, plotUuid));
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
          onClick={() => dispatch(loadGeneExpression(experimentId, selectedGenes, plotUuid))}
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

  const plotStylingControlsConfig = [
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
              selectedGenes={selectedGenes}
              plotUuid={plotUuid}
              onGeneEnter={onGeneEnter}
            />
            <PlotStyling formConfig={plotStylingControlsConfig} config={config} onUpdate={updatePlotWithChanges} defaultActiveKey={['5']} />
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
