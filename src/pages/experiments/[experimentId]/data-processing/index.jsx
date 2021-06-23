import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Link from 'next/link';
import {
  Select, Space, Button, Typography, Alert,
  Row, Col, Carousel, Card, Modal, Skeleton,
  Tooltip
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  CloseOutlined,
  EllipsisOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

import _ from 'lodash';

import Header from '../../../../components/Header';

import CellSizeDistribution from '../../../../components/data-processing/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from '../../../../components/data-processing/MitochondrialContent/MitochondrialContent';
import Classifier from '../../../../components/data-processing/Classifier/Classifier';
import GenesVsUMIs from '../../../../components/data-processing/GenesVsUMIs/GenesVsUMIs';
import DoubletScores from '../../../../components/data-processing/DoubletScores/DoubletScores';
import DataIntegration from '../../../../components/data-processing/DataIntegration/DataIntegration';
import ConfigureEmbedding from '../../../../components/data-processing/ConfigureEmbedding/ConfigureEmbedding';

import PlatformError from '../../../../components/PlatformError';

import StepsIndicator from '../../../../components/data-processing/StepsIndicator';
import StatusIndicator from '../../../../components/data-processing/StatusIndicator';

import SingleComponentMultipleDataContainer from '../../../../components/SingleComponentMultipleDataContainer';
import { loadProcessingSettings, updateProcessingSettings, saveProcessingSettings } from '../../../../redux/actions/experimentSettings';
import loadCellSets from '../../../../redux/actions/cellSets/loadCellSets';
import { loadSamples } from '../../../../redux/actions/samples'
import { runPipeline } from '../../../../redux/actions/pipeline';
import PipelineRedirectToDataProcessing from '../../../../components/PipelineRedirectToDataProcessing';


const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = ({ experimentId, experimentData, route }) => {
  const dispatch = useDispatch();
  const dispatchDebounce = useCallback(_.debounce((f) => {
    dispatch(f);
  }, 1500), []);

  const completedPath = '/experiments/[experimentId]/data-exploration';

  const pipelineStatus = useSelector((state) => state.experimentSettings.backendStatus.status.pipeline);

  const processingConfig = useSelector((state) => state.experimentSettings.processing);
  const samples = useSelector((state) => state.samples)

  const pipelineStatusKey = pipelineStatus?.status;
  const pipelineRunning = pipelineStatusKey === 'RUNNING';

  // Pipeline is not loaded (either running or in an errored state)
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];
  const pipelineNotFinished = pipelineRunning || pipelineErrors.includes(pipelineStatusKey);

  const completedSteps = pipelineStatus?.completedSteps;

  const cellSets = useSelector((state) => state.cellSets);

  const [changesOutstanding, setChangesOutstanding] = useState(false);

  const [stepIdx, setStepIdx] = useState(0);
  const [applicableFilters, setApplicableFilters] = useState([])
  const [preFilteredSamples, setPreFilteredSamples] = useState([])
  const [stepDisabledByCondition, setStepDisabledByCondition] = useState(false)
  const carouselRef = useRef(null);
  const changedFilters = useRef(new Set())

  const disableStepsOnCondition = {
    prefilter: ['classifier'],
    unisample: []
  }

  const disabledConditionMessage = {
    prefilter: `This filter disabled because samples ${preFilteredSamples.join(', ')} ${preFilteredSamples.length > 1 ? 'are' : 'is'} pre-filtered. 
      Click 'Next' to continue processing your data.`,
    unisample: "This step is disabled as there is only one sample. Click 'Next' to continue processing your data."
  }

  const sampleKeys = cellSets.hierarchy?.find(
    (rootNode) => (rootNode.key === 'sample'),
  )?.children.map(
    (child) => child.key,
  );

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (experimentId) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    if (samples.meta.loading) {
      dispatch(loadSamples(experimentId));
      return;
    }

    const sampleIds = Object.keys(samples);

    if (sampleIds.length > 0) {
      setPreFilteredSamples(
        sampleIds.filter(
          (sampleUuid) => samples[sampleUuid].preFiltered
        )
      )
    }

  }, [samples.meta.loading, samples])

  useEffect(() => {
    if (
      preFilteredSamples.length > 0
      && !processingConfig.meta.loading
      && !processingConfig.meta.loadingSettingsError
      && processingConfig[steps[stepIdx].key].enabled
    ) {
      disableStepsOnCondition.prefilter.forEach((step) => {
        dispatch(updateProcessingSettings(experimentId, step, { enabled: false }))
        dispatch(saveProcessingSettings(experimentId, step))
      })
    }

  }, [stepIdx, preFilteredSamples, processingConfig.meta])

  useEffect(() => {
    if (sampleKeys && sampleKeys.length === 1) {
      disableStepsOnCondition.unisample.forEach((step) => {
        dispatch(updateProcessingSettings(experimentId, step, { enabled: false }))
        dispatch(saveProcessingSettings(experimentId, step))
      })
    }
  }, [cellSets])

  useEffect(() => {
    const applicableFilters = Object.entries(disableStepsOnCondition).filter(([key, value]) => value.includes(steps[stepIdx].key))

    // Get the first value because return of Object.entries is [filterName,[steps]]
    setApplicableFilters(applicableFilters.map(filter => filter[0]))
    setStepDisabledByCondition(
      applicableFilters.length > 0
      && !processingConfig[steps[stepIdx].key]?.enabled
    )
  }, [stepIdx])

  const upcomingStepIdxRef = useRef(null);

  // Checks if the step is in the 'completed steps' list we get from the pipeline status
  const isStepComplete = (stepName) => {
    const lowerCaseStepName = stepName.toLowerCase();

    const stepAppearances = _.filter(completedSteps, (stepPipelineName) => {
      return stepPipelineName.toLowerCase().includes(lowerCaseStepName);
    });

    return stepAppearances.length > 0;
  }

  const onConfigChange = (key) => {
    changedFilters.current.add(key)
    setChangesOutstanding(true);
  };

  const inputsList = sampleKeys?.map((key) => ({ key, headerName: `Sample ${cellSets.properties?.[key].name}`, params: { ...cellSets.properties?.[key], key } }));

  const steps = [
    {

      key: 'classifier',
      name: 'Classifier filter',
      description: 'The Classifier filter is based on the ‘emptyDrops’ method which distinguishes between droplets containing cells and ambient RNA',
      multiSample: true,
      render: (key) => (

        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <Classifier
              id={'classifier'}
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={()=>onConfigChange(key)}
              stepDisabled={!processingConfig[key]?.enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'cellSizeDistribution',
      name: 'Cell size distribution filter',
      description: 'The number of unique molecular identifiers (#UMIs) per cell distinguishes real cells (high #UMIs per cell) from empty droplets (low #UMIs per cell). This filter is used to detect empty droplets and fine-tunes the Classifier filter. In some datasets this filter might be used instead of the Classifier filter.',
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <CellSizeDistribution
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={()=>onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'mitochondrialContent',
      name: 'Mitochondrial content filter',
      description: 'A high percentage of mitochondrial reads is an indicator of cell death. UMIs mapped to mitochondrial genes are calculated as a percentage of total UMIs. The percentage of mitochondrial reads depends on the cell type. The typical cut-off range is 10-50%, with the default cut-off set to 20%.',
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <MitochondrialContent
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={()=>onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'numGenesVsNumUmis',
      name: 'Number of genes vs UMIs filter',
      description: 'The number of expressed genes per cell and number of UMIs per cell is expected to have a linear relationship. This filter is used to exclude outliers (e.g. many UMIs originating from only a few genes).',
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <GenesVsUMIs
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={()=>onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'doubletScores',
      name: 'Doublet filter',
      description: <span>Droplets may contain more than one cell. In such cases, it is not possible to distinguish which reads came from which cell. Such “cells” cause problems in the downstream analysis as they appear as an intermediate type. “Cells” with a high probability of being a doublet should be excluded. The probability of being a doublet is calculated using ‘scDblFinder’. For each sample, the default threshold tries to minimize both the deviation in the expected number of doublets and the error of a trained classifier. For more details see <a href="https://bioconductor.org/packages/devel/bioc/vignettes/scDblFinder/inst/doc/scDblFinder.html#thresholding" target="_blank">scDblFinder thresholding</a>.</span>,
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <DoubletScores
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={()=>onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'dataIntegration',
      name: 'Data integration',
      multiSample: false,
      render: (key, expId) => (
        <DataIntegration
          experimentId={expId}
          key={key}
          changedFilters={changedFilters}
          onPipelineRun={() => onPipelineRun(Array.from(changedFilters.current))}
          disableDataIntegration={sampleKeys && sampleKeys.length === 1}
        />
      ),
    },
    {
      key: 'configureEmbedding',
      name: 'Configure embedding',
      description: 'Single cell data is very complex. To visualize the relationship (similarity) between cells, we need to reduce this complexity (dimension reduction) to be able to plot (embedd into 2D space).',
      multiSample: false,
      render: (key, expId) => (
        <ConfigureEmbedding
          experimentId={expId}
          key={key}
          changedFilters={changedFilters}
          onPipelineRun={() => onPipelineRun(Array.from(changedFilters.current))}
        />
      ),
    },
  ];

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.goTo(stepIdx, true);
    }
  }, [stepIdx, carouselRef.current]);

  const changeStepId = (newStepIdx) => {
      setStepIdx(newStepIdx);
  }

  // Called when the pipeline is triggered to be run by the user.
  const onPipelineRun = (steps) => {
    setChangesOutstanding(false);
    changedFilters.current = new Set();
    dispatch((runPipeline(experimentId, steps)))

  }

  const renderWithInnerScroll = (innerRenderer) => {
    return (
      <div style={{
        position: 'relative', overflow: 'scroll', height: window.innerHeight * 0.8,
      }}>
        {innerRenderer()}
      </div>
    )
  }

  const renderTitle = () => (
    <>
      <Row style={{ display: 'flex' }}>
        <Col style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Row style={{ display: 'flex' }} gutter={16}>
            <Col>
              {/* Should be just wide enough that no ellipsis appears */}
              <Select
                value={stepIdx}
                onChange={(idx) => {
                  changeStepId(idx);
                }}
                style={{ fontWeight: 'bold', width: 290 }}
                placeholder='Jump to a step...'
              >
                {
                  steps.map(
                    ({ name, key }, i) => {
                      const disabledByPipeline = (pipelineNotFinished && !isStepComplete(key));
                      const text = `${i + 1}. ${name}`;

                      return (
                        <Option
                          value={i}
                          key={key}
                          disabled={
                            disabledByPipeline
                          }
                        >
                          {processingConfig[key]?.enabled === false ? (
                            <>
                              {/* disabled */}
                              <Text
                                type='secondary'

                              >
                                <CloseOutlined />
                              </Text>
                              <span
                                style={{ marginLeft: '0.25rem', textDecoration: 'line-through' }}
                              >
                                {text}
                              </span>
                            </>
                          ) : !disabledByPipeline ? (
                            <>
                              {/* finished */}
                              <Text
                                type='success'

                              >
                                <CheckOutlined />
                              </Text>
                              <span
                                style={{ marginLeft: '0.25rem' }}
                              >
                                {text}
                              </span>
                            </>
                          ) : pipelineRunning && !isStepComplete(key) ? (
                            <>
                              {/* incomplete */}
                              <Text
                                type='warning'
                                strong
                              >
                                <EllipsisOutlined />
                              </Text>
                              <span style={{ marginLeft: '0.25rem' }}>{text}</span>
                            </>
                          ) : pipelineNotFinished && !pipelineRunning && !isStepComplete(key) ? (
                            <>
                              {/* failed */}
                              <Text
                                type='danger'
                                strong
                              >
                                <WarningOutlined />
                              </Text>
                              <span style={{ marginLeft: '0.25rem' }}>{text}</span>
                            </>
                          ) : <></>}
                        </Option>
                      );
                    }
                  )
                }
              </Select>
            </Col>
            <Col>
              {steps[stepIdx].description && (
                <Tooltip title={steps[stepIdx].description}>
                  <Button icon={<InfoCircleOutlined />} />
                </Tooltip>
              )}
            </Col>
            <Col>
              {steps[stepIdx].multiSample && (
                <Button
                  disabled={stepDisabledByCondition}
                  data-testid='enableFilterButton'
                  onClick={() => {
                    dispatch(updateProcessingSettings(
                      experimentId,
                      steps[stepIdx].key,
                      { enabled: !processingConfig[steps[stepIdx].key]?.enabled },
                    ));
                    dispatch(saveProcessingSettings(experimentId, steps[stepIdx].key));
                    setChangesOutstanding(true);
                  }}>
                  {
                    !processingConfig[steps[stepIdx].key]?.enabled
                      ? 'Enable' : 'Disable'
                  }
                </Button>
              )}
            </Col>
            <Col>
              {steps[stepIdx].multiSample && (
                <Button
                  id='runFilterButton'
                  data-testid='runFilterButton'
                  type='primary'
                  onClick={() => { onPipelineRun(changedFilters.current.size ? Array.from(changedFilters.current) : steps[stepIdx].key) }}
                  disabled={!pipelineErrors.includes(pipelineStatusKey) && !changesOutstanding}
                >
                  {pipelineErrors.includes(pipelineStatusKey) ? 'Run Data Processing' : 'Save changes'}
                </Button>
              )}
            </Col>
          </Row>
        </Col>
        <Col style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Row>
            <Col style={{ minHeight: '100%', alignItems: 'center', display: 'flex', marginLeft: 'auto' }}>
              <Space>
                <StepsIndicator
                  allSteps={steps}
                  currentStep={stepIdx}
                  completedSteps={completedSteps.length}
                />
                <Text>{`${completedSteps.length} of ${steps.length} steps complete`}</Text>
              </Space>
            </Col>
            <Col>
              <StatusIndicator />
            </Col>
            <Col style={{ marginLeft: 'auto' }}>
              <Space size='large'>
                <Button
                  data-testid='pipelinePrevStep'
                  disabled={stepIdx === 0}
                  icon={<LeftOutlined />}
                  onClick={() => changeStepId(Math.max(stepIdx - 1, 0))}
                >
                  Previous
                </Button>
                {stepIdx !== steps.length - 1 ? (
                  <Button
                    data-testid='pipelineNextStep'
                    onClick={() => {
                      const newStepIdx = Math.min(stepIdx + 1, steps.length - 1);
                      changeStepId(newStepIdx);
                    }}
                    disabled={steps[stepIdx + 1] && pipelineNotFinished && !isStepComplete(steps[stepIdx + 1].key)}
                  >
                    Next
                    <RightOutlined />
                  </Button>
                )
                  : (
                    <Link as={completedPath.replace('[experimentId]', experimentId)} href={completedPath} passHref>
                      <Button
                        type='primary'
                        disabled={steps[stepIdx + 1] && pipelineNotFinished && !isStepComplete(steps[stepIdx + 1].key)}
                      >
                        <span style={{ marginRight: '0.25rem' }}>Finish</span>
                        <CheckOutlined />
                      </Button>
                    </Link>
                  )}
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>


    </>
  );

  return (
    <div style={{
      paddingLeft: 32, paddingRight: 32, display: 'flex', flexDirection: 'column', height: '100vh',
    }}
    >
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        route={route}
        title='Data Processing'
      />

      <Card
        title={renderTitle()}
      >
        <Carousel lazyLoad='ondemand' ref={carouselRef} dots={false}>
          {steps.map(({ render, key }) => {
            if (pipelineRunning && !isStepComplete(key)) {
              return <div><PipelineRedirectToDataProcessing pipelineStatus='runningStep' /></div>;
            }

            if (pipelineNotFinished && !isStepComplete(key)) {
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PlatformError
                      description={'We don\'t have anything for this step.'}
                      reason={'The last run ended before this step could be finished.'}
                      onClick={() => { onPipelineRun(steps[stepIdx].key) }}
                    />
                  </div>
                </div>
              );
            }

            if (cellSets.loading || samples.meta.loading || processingConfig.meta.loading) {
              return (
                <div className='preloadContextSkeleton' style={{ padding: '16px 0px' }}>
                  <Skeleton.Input style={{ width: '100%', height: 400 }} active />
                </div>
              );
            }

            if (cellSets.error || samples.meta.error || processingConfig.meta.loadingSettingsError) {
              return (
                <PlatformError
                  error={cellSets.error.toString()}
                  onClick={() => { dispatch(loadCellSets(experimentId)); }}
                />
              );
            }

            return (
              <Space direction='vertical'>
                {processingConfig[steps[stepIdx].key]?.enabled === false ?
                  (
                    stepDisabledByCondition ? (
                      applicableFilters.map(filter =>
                        < Alert
                          message={disabledConditionMessage[filter]}
                          type="info"
                          showIcon
                        />
                      )
                    ) : (
                      < Alert
                        message={'This filter is disabled. You can still modify and save changes, but the filter will not be applied to your data.'}
                        type="info"
                        showIcon
                      />
                    )
                  ) : <></>
                }
                { renderWithInnerScroll(() => render(key, experimentId))}
              </Space>
            )
          })}
        </Carousel>
      </Card>
    </div >
  );
};

DataProcessingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  route: PropTypes.string.isRequired,
};

export default DataProcessingPage;
