import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import DotPlot from 'components/plots/DotPlot';
import { loadPaginatedGeneProperties, loadGeneExpression } from 'redux/actions/genes';
import { loadCellSets } from 'redux/actions/cellSets';
import PlotStyling from 'components/plots/styling/PlotStyling';
import SelectData from 'components/plots/styling/SelectData';
import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import Header from 'components/plots/Header';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig';

const { Panel } = Collapse;
const plotUuid = 'dotPlotMain';
const plotType = 'dotPlot';
const route = {
  path: 'dot-plot',
  breadcrumbName: 'Dot plot',
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
    panelTitle: 'Colours',
    controls: ['colourScheme', 'colourInversion'],
  },
  {
    panelTitle: 'Legend',
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

const dotPlot = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const {
    fetching: genesFetching,
    data: highestDispersionGenes,
  } = useSelector((state) => state.genes.properties.views[plotUuid] || {});
  const cellSets = useSelector((state) => state.cellSets);

  const PROPERTIES = ['dispersions'];
  const tableState = {
    pagination: {
      current: 1, pageSize: config?.nMarkerGenes ?? 3, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
  };

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));

    if (cellSets.hierarchy.length === 0) dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (config?.selectedGenes.length === 0 && !genesFetching && !highestDispersionGenes) {
      dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
    }
  }, [highestDispersionGenes, config, genesFetching]);

  useEffect(() => {
    if (config?.selectedGenes.length === 0 && highestDispersionGenes?.length > 0) {
      updatePlotWithChanges({ selectedGenes: highestDispersionGenes });
      dispatch(loadGeneExpression(experimentId, highestDispersionGenes, plotUuid));
    }
  }, [highestDispersionGenes, config]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <MarkerGeneSelection
          config={config}
          onUpdate={updatePlotWithChanges}
          onReset={() => updatePlotWithChanges({ selectedGenes: [] })}
        />
      </Panel>
      <Panel header='Select data' key='15'>
        {config && !cellSets.loading && !cellSets.error ? (
          <SelectData
            config={config}
            onUpdate={updatePlotWithChanges}
            cellSets={cellSets}
            isValueForYAxis={false}
          />
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
    </>
  );

  if (!config) {
    return <Skeleton />;
  }

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
                <center>
                  <DotPlot config={config} />
                </center>
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
              defaultActiveKey={['gene-selection']}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

dotPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default dotPlot;
