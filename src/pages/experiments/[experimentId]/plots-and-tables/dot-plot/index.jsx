import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Radio,
  InputNumber,
  Select,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import DotPlot from 'components/plots/DotPlot';
import { loadPaginatedGeneProperties, loadGeneExpression } from 'redux/actions/genes';
import { loadCellSets } from 'redux/actions/cellSets';
import PlotStyling from 'components/plots/styling/PlotStyling';
import SelectData from 'components/plots/styling/SelectData';
import Header from 'components/plots/Header';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig';

import Loader from 'components/Loader';

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
    panelTitle: 'Axes and Margins',
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

const defaultNGenes = 5;

const dotPlot = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const fetching = useSelector((state) => state.genes.properties.views[plotUuid]?.fetching);
  const cellSets = useSelector((state) => state.cellSets);
  const highestDispersionGenes = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data,
  );

  const PROPERTIES = ['dispersions'];
  const tableState = {
    pagination: {
      current: 1, pageSize: config?.nMarkerGenes ?? defaultNGenes, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
  };

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));

    if (cellSets.hierarchy.length === 0) dispatch(loadCellSets(experimentId));
  }, []);

  if (config?.genes.length === 0 && !fetching && !highestDispersionGenes) {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  }

  useEffect(() => {
    if (config?.genes.length === 0 && highestDispersionGenes?.length > 0) {
      updatePlotWithChanges({ genes: highestDispersionGenes });
      dispatch(loadGeneExpression(experimentId, highestDispersionGenes, plotUuid));
    }
  }, [highestDispersionGenes, config]);

  if (!config) {
    return <Skeleton />;
  }

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <Space direction='vertical' size='middle'>
          <Radio.Group
            onChange={(e) => updatePlotWithChanges({ markerGenes: e.target.value })}
            value={config.markerGenes}
          >
            <Radio value={false}>Custom genes</Radio>
            <Radio value>Marker genes</Radio>
          </Radio.Group>
          {
            !config.markerGenes
              ? (
                <Space direction='vertical' size='small'>
                  <p>Type in a gene name and hit space or enter to add it to the heatmap.</p>
                  <Select
                    mode='tags'
                    style={{ width: '100%' }}
                    placeholder='Select genes...'
                    onChange={(genes) => updatePlotWithChanges({ genes })}
                    value={config.genes}
                    tokenSeparators={[' ']}
                    notFoundContent='No gene added yet.'
                  />
                </Space>
              )
              : (
                <Space>
                  <p>Number of genes</p>
                  <InputNumber
                    size='small'
                    value={config.nMarkerGenes}
                    onChange={(value) => updatePlotWithChanges({ nMarkerGenes: value })}
                  />
                </Space>
              )
          }
        </Space>
      </Panel>
      <Panel header='Select Data' key='15'>
        {config && !cellSets.loading && !cellSets.error ? (
          <SelectData
            config={config}
            onUpdate={updatePlotWithChanges}
            cellSets={cellSets}
          />
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
    </>
  );

  const renderPlot = () => {
    if (!config) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <DotPlot config={config} />
      </center>
    );
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
