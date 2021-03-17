/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Input,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import SelectData from '../../../../../components/plots/styling/embedding-continuous/SelectData';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import Header from '../../../../../components/plots/Header';
import ContinuousEmbeddingPlot from '../../../../../components/plots/ContinuousEmbeddingPlot';
import Loader from '../../../../../components/Loader';

const { Panel } = Collapse;
const { Search } = Input;

const route = {
  path: 'embedding-continuous',
  breadcrumbName: 'Continuous Embedding',
};

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingContinuousMain';
const plotType = 'embeddingContinuous';

const EmbeddingContinuousIndex = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state?.cellSets);
  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);

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

  const changeDislayedGene = (geneName) => {
    updatePlotWithChanges({ shownGene: geneName });
  };

  if (!config) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene Selection' key='666'>
        <Search
          style={{ width: '100%' }}
          enterButton='Search'
          defaultValue={config.shownGene}
          onSearch={(val) => changeDislayedGene(val)}
        />
      </Panel>
      <Panel header='Select Data' key='15'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
    </>
  );

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
        onUpdate={updatePlotWithChanges}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <ContinuousEmbeddingPlot
                  experimentId={experimentId}
                  config={config}
                  plotUuid={plotUuid}
                />
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <PlotStyling formConfig={plotStylingControlsConfig} config={config} onUpdate={updatePlotWithChanges} renderExtraPanels={renderExtraPanels} />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

EmbeddingContinuousIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingContinuousIndex;
