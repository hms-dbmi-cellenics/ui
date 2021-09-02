/* eslint-disable import/no-unresolved */
/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import PlotStyling from 'components/plots/styling/PlotStyling';
import SelectCluster from 'components/plots/styling/trajectory-analysis/SelectCluster';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadTrajectoryAnalysis } from 'redux/actions/trajectoryAnalysis';
import Header from 'components/plots/Header';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

const { Panel } = Collapse;

const route = {
  path: 'trajectory-analysis',
  breadcrumbName: 'Trajectory Analysis',
};

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'trajectoryAnalysisMain';
const plotType = 'trajectoryAnalysis';

const TrajectoryAnalysisIndex = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state.cellSets);

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (cellSets.hierarchy.length === 0) dispatch(loadCellSets(experimentId));
    dispatch(loadProcessingSettings(experimentId));
  }, []);

  useEffect(() => {
    if (config?.rootNode && !cellSets.loading && !cellSets.error) {
      dispatch(loadTrajectoryAnalysis(experimentId, config.rootNode));
    }
  }, [config]);

  // updateField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(plotUuid, updateField));
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main schema',
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
      panelTitle: 'Axes and Margins',
      controls: ['axes'],
    },
    {
      panelTitle: 'Colours',
      controls: ['colourScheme', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  const renderExtraPanels = () => (
    <>
      <Panel header='Select Data' key='15'>
        {config && !cellSets.loading && !cellSets.error ? (
          <SelectCluster
            config={config}
            onUpdate={updatePlotWithChanges}
            cellSets={cellSets}
          />
        ) : <Skeleton.Input style={{ width: 200 }} active />}

      </Panel>
    </>
  );

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <TrajectoryAnalysisPlot
                  experimentId={experimentId}
                  config={config}
                  plotUuid={plotUuid}
                  plotData={[]}
                />
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey={15}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

TrajectoryAnalysisIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisIndex;
