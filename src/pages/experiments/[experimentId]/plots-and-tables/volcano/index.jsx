import React, { useEffect, useState, useRef } from 'react';
import {
  Row,
  Col,
  Collapse,
  Skeleton,
  Empty,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import _ from 'lodash';
import ExportAsCSV from 'components/plots/ExportAsCSV';
import PropTypes from 'prop-types';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import PlotStyling from 'components/plots/styling/PlotStyling';
import { Vega } from 'react-vega';

import loadDifferentialExpression from 'redux/actions/differentialExpression/loadDifferentialExpression';
import DiffExprCompute from 'components/data-exploration/differential-expression-tool/DiffExprCompute';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig';
import { getCellSetKey } from 'utils/cellSets';
import PlatformError from 'components/PlatformError';
import { setComparisonGroup } from 'redux/actions/differentialExpression';
import Loader from 'components/Loader';

import { generateSpec } from 'utils/plotSpecs/generateVolcanoSpec';
import calculateVolcanoDataPoints from 'components/plots/helpers/calculateVolcanoDataPoints';
import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = 'volcanoPlotMain';
const plotType = 'volcano';

const VolcanoPlotPage = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();
  const comparisonCreated = useRef(false);
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const {
    loading: diffExprLoading,
    data: diffExprData,
    error: diffExprError,
    cellSets: plotCellSets,
    comparisonType: plotComparisonType,
  } = useSelector(
    (state) => state.differentialExpression.properties,
  );
  const comparison = useSelector((state) => state.differentialExpression.comparison);

  const [plotData, setPlotData] = useState([]);
  const [maxYAxis, setMaxYAxis] = useState(null);
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
    setComparisonGroup({
      ...plotCellSets,
      type: plotComparisonType,
    });
  }, []);

  useEffect(() => {
    if (!config || !diffExprData.length) return;
    setPlotData(calculateVolcanoDataPoints(config, diffExprData));
  }, [config, diffExprData]);

  const getMaxNegativeLogPValue = (data) => data.reduce((maxNegativeLogPValue, datum, i) => {
    if (!datum.p_val_adj || datum.p_val_adj === 0) return maxNegativeLogPValue;
    return Math.max(maxNegativeLogPValue, -Math.log10(datum.p_val_adj));
  }, 0);

  useEffect(() => {
    if (plotData.length === 0) return;

    const maxNegativeLogpValue = getMaxNegativeLogPValue(plotData);
    setMaxYAxis(Math.round(maxNegativeLogpValue));
  }, [plotData]);

  const currentConfig = useRef(null);

  useEffect(() => {
    if (config && !_.isEqual(currentConfig.current !== config)) {
      currentConfig.current = config;
      setSpec(generateSpec(config, plotData));
    }
  }, [config, plotData]);

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main schema',
      controls: [{
        name: 'volcanoDimensions',
        props: {
          xMax: 20,
          yMax: maxYAxis * 2,
        },
      }],
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
      panelTitle: 'Data thresholding',
      controls: ['volcanoThresholds'],
    },
    {
      panelTitle: 'Axes and margins',
      controls: ['axes'],
    },
    {
      panelTitle: 'Colours',
      controls: ['volcanoMarkers', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
    },
    {
      panelTitle: 'Add Labels',
      controls: [{
        name: 'volcanoLabels',
        props: {
          min: 0,
          max: maxYAxis + 5,
        },
      },
      ],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onComputeDiffExp = () => {
    comparisonCreated.current = true;
    dispatch(
      loadDifferentialExpression(experimentId, comparison.group[comparison.type], comparison.type),
    );
    updatePlotWithChanges(comparison.group[comparison.type]);
  };

  const generateExportDropdown = () => {
    let {
      cellSet, compareWith,
    } = comparison.group[comparison.type];

    // Remove 'groups' from 'group/cluster' name for use in filename below
    if (cellSet && compareWith) {
      cellSet = getCellSetKey(cellSet);
      compareWith = getCellSetKey(compareWith);
    }

    const date = moment.utc().format('YYYY-MM-DD-HH-mm-ss');
    const fileName = `de_${experimentId}_${cellSet}_vs_${compareWith}_${date}.csv`;
    const disabled = plotData.length === 0 || diffExprLoading || diffExprError;

    return (
      <ExportAsCSV
        data={diffExprData}
        filename={fileName}
        disabled={disabled}
      />
    );
  };

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (diffExprError) {
      return (
        <PlatformError
          description='Could not load differential expression data.'
          onClick={() => {
            dispatch(
              loadDifferentialExpression(
                experimentId,
                comparison.group[comparison.type],
                comparison.type,
              ),
            );
          }}
        />
      );
    }

    if (!comparisonCreated.current) {
      return (
        <Empty description='Create a comparison to get started' />
      );
    }

    if (plotData.length === 0 || diffExprLoading) {
      return <Loader experimentId={experimentId} />;
    }

    return <Vega spec={spec} renderer='canvas' />;
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Differential expression' key='differential-expression'>
        <DiffExprCompute
          experimentId={experimentId}
          onCompute={onComputeDiffExp}
        />
      </Panel>
    </>
  );

  return (
    <>
      <Header title={plotNames.VOLCANO_PLOT} />
      <div style={{ width: '100%', padding: '0 16px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <PlotContainer
              experimentId={experimentId}
              plotUuid={plotUuid}
              plotType={plotType}
              extra={generateExportDropdown()}
            >
              <center>{renderPlot()}</center>
            </PlotContainer>
          </Col>
          <Col span={8}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActivePanelKey='differential-expression'
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

VolcanoPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default VolcanoPlotPage;
