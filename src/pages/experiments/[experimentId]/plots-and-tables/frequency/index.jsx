/* eslint-disable import/no-unresolved */
/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Radio,
  Alert,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { getCellSets } from 'redux/selectors';
import SelectCellSets from 'components/plots/styling/frequency/SelectCellSets';
import PlotHeader from 'components/plots/PlotHeader';

import PlotStyling from 'components/plots/styling/PlotStyling';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig';
import PlatformError from 'components/PlatformError';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';

import FrequencyPlot from 'components/plots/FrequencyPlot';
import Loader from 'components/Loader';

const { Panel } = Collapse;
const plotUuid = 'frequencyPlotMain';
const plotType = 'frequency';
const route = {
  path: 'frequency',
  breadcrumbName: 'Frequency plot',
};

const FrequencyPlotPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const {
    loading: cellSetsLoading,
    error: cellSetsError,
  } = cellSets;

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const dataExplorationPath = '/experiments/[experimentId]/data-exploration';

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
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
      panelTitle: 'Axes and margins',
      controls: ['axes'],
    },
    {
      panelTitle: 'Legend',
      footer: <Alert
        message={
          ['Changing cell set colours is not currently available here. Use the Data Management tool in ',
            <Link as={dataExplorationPath.replace('[experimentId]', experimentId)} href={dataExplorationPath} passHref>Data Exploration</Link>,
            ' to customise cell set colours.']
        }
        type='info'
      />,
      controls: [
        {
          name: 'legend',
          props: {
            option: {
              positions: 'top-bottom',
            },
          },
        },
      ],
    },
  ];

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (cellSetsError) {
      return (
        <PlatformError
          description={cellSetsError}
          onClick={() => loadCellSets(experimentId)}
        />
      );
    }
    if (!config || cellSetsLoading) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <FrequencyPlot
          experimentId={experimentId}
          config={config}
        />
      </center>
    );
  };
  const changePlotType = (value) => {
    updatePlotWithChanges({
      frequencyType: value.target.value,
    });
    if (value.target.value === 'proportional') {
      updatePlotWithChanges({ axes: { yAxisText: 'Proportion' } });
    } else {
      updatePlotWithChanges({ axes: { yAxisText: 'Count' } });
    }
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Select data' key='20'>
        <SelectCellSets
          config={config}
          onUpdate={updatePlotWithChanges}
        />
      </Panel>
      <Panel header='Plot Type' key='1'>
        <Radio.Group
          onChange={(value) => changePlotType(value)}
          value={config.frequencyType}
        >
          <Radio value='proportional'>Proportional</Radio>
          <Radio value='count'>Count</Radio>
        </Radio.Group>
      </Panel>
    </>
  );

  return (
    <>
      <PlotHeader
        plotUuid={plotUuid}
        experimentId={experimentId}
      />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey='1'>
                <Panel header='Preview' key='1'>
                  {renderPlot()}
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
              />
            </Space>
          </Col>
        </Row>
      </Space>
    </>
  );
};

FrequencyPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default FrequencyPlotPage;
