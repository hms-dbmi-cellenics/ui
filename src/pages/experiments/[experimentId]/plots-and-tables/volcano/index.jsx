import React, { useEffect, useState, useRef } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Button, Empty, Typography,
} from 'antd';
import _ from 'lodash';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import { generateSpec } from '../../../../../utils/plotSpecs/generateVolcanoSpec';
import Header from '../../../../../components/plots/Header';
import DiffExprCompute from '../../../../../components/data-exploration/differential-expression-tool/DiffExprCompute';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig';
import loadDifferentialExpression from '../../../../../redux/actions/differentialExpression/loadDifferentialExpression';
import PlatformError from '../../../../../components/PlatformError';
import { setComparisonGroup } from '../../../../../redux/actions/differentialExpression';
import Loader from '../../../../../components/Loader';

const { Text } = Typography;
const { Panel } = Collapse;

const route = {
  path: 'volcano',
  breadcrumbName: 'Volcano plot',
};

const plotUuid = 'volcanoPlotMain';
const plotType = 'volcano';

const VolcanoPlot = ({ experimentId }) => {
  const dispatch = useDispatch();
  const comparisonCreated = useRef(false);
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const {
    loading, data, error, cellSets: plotCellSets, comparisonType: plotComparisonType,
  } = useSelector(
    (state) => state.differentialExpression.properties,
  );
  const comparison = useSelector((state) => state.differentialExpression.comparison);
  const [plotData, setPlotData] = useState([]);
  const [spec, setSpec] = useState({
    spec: null,
    maxNegativeLogpValue: null,
  });

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  useEffect(() => {
    // Sync plot and settings with last used config
    setComparisonGroup({
      ...plotCellSets,
      type: plotComparisonType,
    });

    // Show plot using last shown data
    if (data.length === 0) return;
    setDataPointStatus();
  }, []);

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main Schema',
      controls: [{
        name: 'volcanoDimensions',
        props: {
          xMax: 20,
          yMax: Math.round(spec.maxNegativeLogpValue) * 2,
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
      panelTitle: 'Data Thresholding',
      controls: ['volcanoThresholds'],
    },
    {
      panelTitle: 'Axes and Margins',
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
          max: spec.maxNegativeLogpValue + 5,
        },
      },
      ],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  useEffect(() => {
    if (!config) return;
    setDataPointStatus();
    const generatedSpec = generateSpec(config, plotData);
    setSpec(generatedSpec);
  }, [config]);

  useEffect(() => {
    if (data.length === 0) return;
    setDataPointStatus();
  }, [data]);

  useEffect(() => {
    if (plotData.length === 0) return;
    const generatedSpec = generateSpec(config, plotData);
    setSpec(generatedSpec);
  }, [plotData]);

  const setDataPointStatus = () => {
    const dataPoints = _.cloneDeep(data);
    dataPoints
      .filter((datum) => {
        const { avg_log2FC } = datum;
        const p_val_adj = parseFloat(datum.p_val_adj);

        // Downsample insignificant, not changing genes by the appropriate amount.
        const isSignificant = (avg_log2FC < config.logFoldChangeThreshold * -1
          || avg_log2FC > config.logFoldChangeThreshold)
          && p_val_adj < config.pvalueThreshold;

        if (isSignificant) {
          return true;
        }

        if (Math.random() > config.downsampleRatio) {
          return true;
        }

        return false;
      })
      .map((datum) => {
        // Add a status to each gene depending on where they lie in the system.
        // Note: the numbers in these names are important. In the schema, we
        // order the colors by the names, and the names are declared sorted,
        // so they must be alphabetically ordered.
        let status;
        const { avg_log2FC } = datum;
        const p_val_adj = parseFloat(datum.p_val_adj);

        const pvalueThreshold = (
          10
          ** (-1 * config.negLogpValueThreshold)
        ).toExponential(3);

        if (
          p_val_adj <= pvalueThreshold
          && avg_log2FC >= config.logFoldChangeThreshold
        ) {
          status = 'Upregulated';
        } else if (
          p_val_adj <= pvalueThreshold
          && avg_log2FC <= config.logFoldChangeThreshold * -1
        ) {
          status = 'Downregulated';
        } else if (
          p_val_adj > pvalueThreshold
          && datum.avg_log2FC >= config.logFoldChangeThreshold
        ) {
        } else {
          status = 'No difference';
        }
        // eslint-disable-next-line no-param-reassign
        datum.status = status;

        return datum;
      });
    setPlotData(dataPoints);
  };

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
      cellSet = cellSet.split('/')[1] || cellSet;
      compareWith = compareWith.split('/')[1] || compareWith;
    }

    const date = moment.utc().format('YYYY-MM-DD-HH-mm-ss');
    const fileName = `de_${experimentId}_${cellSet}_vs_${compareWith}_${date}.csv`;
    const disabled = plotData.length === 0 || loading || _.isEmpty(spec.spec) || error;

    return (
      <CSVLink data={data} filename={fileName}>
        <Button
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          size='small'
        >
          Export as CSV...
        </Button>
      </CSVLink>
    );
  };
  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (error) {
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
        <Empty description={(
          <>
            <p>
              <Text>Create a comparison to get started.</Text>
            </p>
          </>
        )}
        />
      );
    }

    if (plotData.length === 0 || loading || _.isEmpty(spec.spec)) {
      return <Loader experimentId={experimentId} />;
    }

    return (
      <Vega data={{ data: plotData }} spec={spec.spec} renderer='canvas' />
    );
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Differential Expression' key='1'>
        <DiffExprCompute
          experimentId={experimentId}
          onCompute={onComputeDiffExp}
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
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1' extra={generateExportDropdown()}>
                <center>{renderPlot()}</center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']} accordion />
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey={['1']}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

VolcanoPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default VolcanoPlot;
