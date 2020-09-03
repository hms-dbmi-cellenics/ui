import React, { useEffect, useState } from 'react';
import {
  Row, Col, Space, Collapse, Slider, Skeleton, Spin,
} from 'antd';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import ThresholdsGuidesEditor from './components/ThresholdsGuidesEditor';
import MarkersEditor from './components/MarkersEditor';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import DimensionsRangeEditorVolcano from './components/DimensionsRangeEditorVolcano';
import AxesDesign from '../components/AxesDesign';
import FontDesign from '../components/FontDesign';
import ColourInversion from '../components/ColourInversion';
import LegendEditor from '../components/LegendEditor';
import generateSpec from '../../../../../utils/plotSpecs/generateVolcanoSpec';
import Header from '../components/Header';
import DiffExprCompute from '../../data-exploration/components/differential-expression-tool/DiffExprCompute';
import isBrowser from '../../../../../utils/environment';
import { updatePlotConfig, loadPlotConfig } from '../../../../../redux/actions/plots/index';
import loadDifferentialExpression from '../../../../../redux/actions/loadDifferentialExpression';
import renderError from '../utils/renderError';

const { Panel } = Collapse;
const route = {
  path: 'volcano',
  breadcrumbName: 'Volcano plot',
};

const plotUuid = 'volcanoPlotMain';
const plotType = 'volcano';

const VolcanoPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const { loading, data, error } = useSelector((state) => state.differentialExpression.properties);
  const [plotData, setPlotData] = useState([]);
  const [spec, setSpec] = useState({ spec: null, maxNegativeLogpValue: null, xMax: null });

  const router = useRouter();
  const { experimentId } = router.query;

  useEffect(() => {
    if (!isBrowser) return;

    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  useEffect(() => {
    if (!config) return;
    if (_.isEmpty(config.cellSets)) return;

    dispatch(loadDifferentialExpression(experimentId, config.cellSets));
  }, [config?.cellSets]);

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
    dataPoints.filter((datum) => {
      // Downsample insignificant, not changing genes by the appropriate amount.
      const isSignificant = (
        datum.log2fc < config.logFoldChangeThreshold * -1
        || datum.log2fc > config.logFoldChangeThreshold)
        && datum.qval < config.pvalueThreshold;

      if (isSignificant) {
        return true;
      }

      if (Math.random() > config.downsampleRatio) {
        return true;
      }

      return false;
    }).map((datum) => {
      // Add a status to each gene depending on where they lie in the system.
      // Note: the numbers in these names are important. In the schema, we
      // order the colors by the names, and the names are declared sorted,
      // so they must be alphabetically ordered.
      let status;

      const pvalueThreshold = (10 ** (-1 * config.negLogpValueThreshold)).toExponential(3);

      if (datum.qval <= pvalueThreshold
        && datum.log2fc >= config.logFoldChangeThreshold) {
        status = '1_significantUpregulated';
      } else if (datum.qval <= pvalueThreshold
        && datum.log2fc <= config.logFoldChangeThreshold * -1) {
        status = '2_significantDownregulated';
      } else if (datum.qval > pvalueThreshold
        && datum.log2fc >= config.logFoldChangeThreshold) {
        status = '3_notSignificantUpregulated';
      } else if (datum.qval > pvalueThreshold
        && datum.log2fc <= config.logFoldChangeThreshold * -1) {
        status = '4_notSignificantDownregulated';
      } else if (datum.qval <= pvalueThreshold
        && datum.log2fc > config.logFoldChangeThreshold * -1
        && datum.log2fc < config.logFoldChangeThreshold) {
        status = '5_significantChangeDirectionUnknown';
      } else {
        status = '6_noDifference';
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

  const onComputeDiffExp = (cellSets) => {
    // These reset the ranges to `null`, which makes them automatically
    // determined by the algorithm. Because of our bad DE, we have issues
    // where we have extreme values, so this is not necessary right now.
    // TODO: fix this when we have good DE

    // maxNegativeLogpValueDomain: null,
    // logFoldChangeDomain: null,
    updatePlotWithChanges({ cellSets });
  };

  if (!config) {
    return (<Skeleton />);
  }

  const renderPlot = () => {
    if (error) {
      return renderError('Could not load differential expression data.', () => {
        dispatch(loadDifferentialExpression(experimentId, config.diffExpData));
      });
    }

    if (plotData.length === 0 || loading || _.isEmpty(spec.spec)) {
      return <Spin />;
    }

    return <Vega data={{ data: plotData }} spec={spec.spec} renderer='canvas' />;
  };

  return (
    <>
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
            <Collapse defaultActiveKey={['1']} accordion>
              <Panel header='Differential Expression' key='15'>
                <DiffExprCompute
                  experimentId={experimentId}
                  onCompute={onComputeDiffExp}
                  cellSets={config.cellSets}
                />
              </Panel>
              <Panel header='Main Schema' key='1'>
                <DimensionsRangeEditorVolcano
                  config={config}
                  onUpdate={updatePlotWithChanges}
                  xMax={Math.round(spec.xMax)}
                  yMax={Math.round(spec.maxNegativeLogpValue) + 2}
                />
                <Collapse defaultActiveKey={['1']} accordion>
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
              <Panel header='Data Thresholding' key='8'>
                <ThresholdsGuidesEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Axes and Margins' key='3'>
                <AxesDesign
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Colours' key='10'>
                <MarkersEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
                <ColourInversion
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Markers' key='4'>
                <PointDesign
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Text' key='11'>
                <> Display Gene Labels Above (-log10 pvalue) </>
                <Slider
                  defaultValue={config.textThresholdValue}
                  min={0}
                  max={spec.maxNegativeLogpValue + 5}
                  onChange={(val) => updatePlotWithChanges({ textThresholdValue: val })}
                />
              </Panel>
              <Panel header='Legend' key='12'>
                <LegendEditor
                  onUpdate={updatePlotWithChanges}
                  legendConfig={[
                    {
                      fill: 'color',
                      encode: {
                        title: {
                          update: {
                            fontSize: { value: 14 },
                          },
                        },
                        labels: {
                          interactive: true,
                          update: {
                            fontSize: { value: 12 },
                            fill: { value: config.masterColour },
                          },
                          hover: {
                            fill: { value: 'firebrick' },
                          },
                        },
                        symbols: {
                          update: {
                            stroke: { value: 'transparent' },
                          },
                        },
                        legend: {
                          update: {
                            stroke: { value: '#ccc' },
                            strokeWidth: { value: 1.5 },
                          },
                        },
                      },
                    },
                  ]}
                />
              </Panel>
            </Collapse>
          </Space>
        </Col>
      </Row>
    </>
  );
};

export default VolcanoPlot;
