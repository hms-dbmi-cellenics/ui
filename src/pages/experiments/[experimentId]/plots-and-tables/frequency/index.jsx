import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Spin,
  Radio,
  Alert,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import TitleDesign from '../components/TitleDesign';
import AxesDesign from '../components/AxesDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import SelectCellSets from './components/SelectCellSets';
import generateSpec from '../../../../../utils/plotSpecs/generateFrequencySpec';
import Header from '../components/Header';
import isBrowser from '../../../../../utils/environment';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import PlatformError from '../../../../../components/PlatformError';
import loadCellSets from '../../../../../redux/actions/cellSets/loadCellSets';

const { Panel } = Collapse;
const plotUuid = 'frequencyPlotMain';
const plotType = 'frequency';
const route = {
  path: 'frequency',
  breadcrumbName: 'Frequency plot',
};

const frequencyPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state.cellSets);
  const {
    loading, error, hierarchy, properties,
  } = cellSets;
  const router = useRouter();
  const { experimentId } = router.query;
  const [plotSpec, setPlotSpec] = useState({});
  const [plotData, setPlotData] = useState();

  useEffect(() => {
    if (!experimentId || !isBrowser) {
      return;
    }
    dispatch(loadCellSets(experimentId));

    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, [experimentId]);

  useEffect(() => {
    if (!config || loading) {
      return;
    }
    setPlotSpec(generateSpec(config));
    setPlotData(generateData());
  }, [config, properties]);

  const getCellOptions = (type) => {
    const filteredOptions = hierarchy.filter((element) => (
      properties[element.key].type === type
    ));
    if (!filteredOptions.length) {
      return [];
    }
    return filteredOptions;
  };
  const optionsMetadata = getCellOptions('metadataCategorical');
  const optionsCellSets = getCellOptions('cellSets');

  useEffect(() => {
    if (loading) {
      return;
    }
    updatePlotWithChanges({
      metadata: optionsMetadata[0].key,
      chosenClusters: optionsCellSets[0].key,
    });
  }, [cellSets]);

  const calculateSum = (chosenClusters, metadataIds) => {
    let sum = 0;
    if (!metadataIds.length) {
      chosenClusters.forEach((cellSetCluster) => {
        sum += properties[cellSetCluster.key].cellIds.size;
      });
      return sum;
    }
    chosenClusters.forEach((cellSetCluster) => {
      const cellSetIds = Array.from(properties[cellSetCluster.key].cellIds);
      sum += metadataIds.filter((id) => cellSetIds.includes(id)).length;
    });
    return sum;
  };
  const getMetadataClusters = (name) => (
    hierarchy.filter((cluster) => (
      cluster.key === name))[0]?.children
  );

  const generateData = () => {
    let data = [];
    const chosenClusters = hierarchy.filter((cluster) => (
      cluster.key === config.chosenClusters))[0]?.children;
    if (!chosenClusters) {
      return [];
    }
    const metadataClusters = getMetadataClusters(config.metadata);
    // if no metadata clusters are available
    // a plot is made with the cellset clusters
    if (!metadataClusters) {
      const sum = calculateSum(chosenClusters, []);
      chosenClusters.forEach((clusterName) => {
        const x = 1;
        const y = properties[clusterName.key].cellIds.size;
        const cluster = properties[clusterName.key];
        data = populateData(x, y, cluster, sum, data);
      });
      return data;
    }
    metadataClusters.forEach((metadataCluster) => {
      const metadataIds = Array.from(properties[metadataCluster.key].cellIds);
      const sum = calculateSum(chosenClusters, metadataIds);

      chosenClusters.forEach((clusterName) => {
        const x = properties[metadataCluster.key].name;
        const cellSetIds = Array.from(properties[clusterName.key].cellIds);
        const y = metadataIds.filter((id) => cellSetIds.includes(id)).length;
        const cluster = properties[clusterName.key];

        if (y !== 0) {
          data = populateData(x, y, cluster, sum, data);
        }
      });
    });
    return data;
  };

  const populateData = (x, y, cluster, sum, data) => {
    let value = y;
    if (config.frequencyType === 'proportional') {
      value = (y / sum) * 100;
    }
    data.push({
      x,
      y: value,
      c: cluster.name,
      color: cluster.color,
    });
    return data;
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };
  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => loadCellSets(experimentId)}
        />
      );
    }
    if (!config || loading || !isBrowser) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }
    return (
      <center>
        <Vega
          spec={plotSpec}
          data={{ data: plotData }}
          renderer='canvas'
        />
      </center>
    );
  };
  const changePlotType = (value) => {
    updatePlotWithChanges({
      frequencyType: value.target.value,
    });
    if (value.target.value === 'proportional') {
      updatePlotWithChanges({ yaxisText: 'Proportion' });
    } else {
      updatePlotWithChanges({ yaxisText: 'Count' });
    }
  };
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
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse accordion>
            <Panel header='Select Data' key='20'>
              <SelectCellSets
                onUpdate={updatePlotWithChanges}
                config={config}
                optionsMetadata={optionsMetadata}
                optionsCellSets={optionsCellSets}
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
              <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onUpdate={updatePlotWithChanges}
                legendEnabled={config.legendEnabled}
                legendPosition={config.legendPosition}
                legendOptions='top-bot'
              />
              <Alert
                message='Changing cell set colours is not currently available here.
              Use the Data Management tool in Data Exploration to customise cell set colours.'
                type='info'
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default frequencyPlot;
