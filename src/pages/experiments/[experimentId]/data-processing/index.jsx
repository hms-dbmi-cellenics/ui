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

  const {
    status: pipelineStatus,
  } = useSelector((state) => state.experimentSettings.pipelineStatus);

  const processingConfig = useSelector((state) => state.experimentSettings.processing);
  const samples = useSelector((state) => state.samples)

  const pipelineStatusKey = pipelineStatus.pipeline?.status;
  const pipelineRunning = pipelineStatusKey === 'RUNNING';

  // Pipeline is not loaded (either running or in an errored state)
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];
  const pipelineNotFinished = pipelineRunning || pipelineErrors.includes(pipelineStatusKey);

  const completedSteps = pipelineStatus.pipeline?.completedSteps;

  const cellSets = useSelector((state) => state.cellSets);

  const [changesOutstanding, setChangesOutstanding] = useState(false);
  const [showChangesWillBeLost, setShowChangesWillBeLost] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [applicableFilters, setApplicableFilters] = useState([])
  const [preFilteredSamples, setPreFilteredSamples] = useState([])
  const [stepDisabledByCondition, setStepDisabledByCondition] = useState(false)
  const carouselRef = useRef(null);

  const disableStepsOnCondition = {
    prefilter: ['classifier'],
    unisample: ['dataIntegration']
  }

  const disabledConditionMessage = {
    prefilter: `This filter disabled because samples ${preFilteredSamples.join(', ')} ${preFilteredSamples.length > 1 ? 'are' : 'is'} pre-filtered.`,
    unisample: "This step is disabled as there is only one sample"
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

    if (samples.ids.length > 0) {
      setPreFilteredSamples(
        samples.ids.filter(
          (sampleUuid) => samples[sampleUuid].preFiltered
        )
      )
    }

  }, [samples.meta.loading])

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

  }, [preFilteredSamples, processingConfig.meta])

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

  const onConfigChange = () => {
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
              onConfigChange={onConfigChange}
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
              onConfigChange={onConfigChange}
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
              onConfigChange={onConfigChange}
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
              onConfigChange={onConfigChange}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'doubletScores',
      name: 'Doublet filter',
      description: 'Droplets may contain more than one cell. In such cases, it is not possible to distinguish which reads came from which cell. Such “cells” cause problems in the downstream analysis as they appear as an intermediate type. “Cells” with a high probability of being a doublet should be excluded. The probability of being a doublet is calculated using ‘Scrublet’. The cut-off is typically set around 0.2.',
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
              onConfigChange={onConfigChange}
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
          onPipelineRun={() => onPipelineRun(key)}
          stepDisabled={!processingConfig[key].enabled}
        />
      ),
    },
    {
      key: 'configureEmbedding',
      name: 'Configure embedding',
      description: 'The number of dimensions used to configure the embedding is set here. This dictates the number of clusters in the Uniform Manifold Approximation and Projection (UMAP) which is taken forward to the ‘Data Exploration’ page.',
      multiSample: false,
      render: (key, expId) => (
        <ConfigureEmbedding
          experimentId={expId}
          key={key}
          onPipelineRun={() => onPipelineRun(key)}
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
    if (changesOutstanding) {
      upcomingStepIdxRef.current = newStepIdx;

      setShowChangesWillBeLost(true);
    } else {
      setStepIdx(newStepIdx);
    }
  }

  // Called when the pipeline is triggered to be run by the user.
  const onPipelineRun = (stepKey) => {
    setChangesOutstanding(false);
    dispatch((runPipeline(experimentId, stepKey)))
  }

  const ignoreLostChanges = () => {
    setShowChangesWillBeLost(false)
    setChangesOutstanding(false);
    setStepIdx(upcomingStepIdxRef.current);
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
      <Modal
        visible={showChangesWillBeLost}
        onOk={ignoreLostChanges}
        onCancel={() => setShowChangesWillBeLost(false)}
        okText='Leave this page'
        cancelText='Stay on this page'
        title='Unsaved changes'
      >
        <Space style={{ margin: '15px' }}>
          <p>
            You have unsaved settings changes. If you leave the page, these changes
            will be lost.
          </p>
        </Space>
      </Modal>
      <Row style={{ display: 'flex' }}>
        <Col style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Row style={{ display: 'flex' }} gutter={16}>
            <Col>
              <Select
                value={stepIdx}
                onChange={(idx) => {
                  changeStepId(idx);
                }}
                style={{ fontWeight: 'bold' }}
                placeholder='Jump to a step...'
              >
                {
                  steps.map(
                    ({ name, key }, i) => {
                      const disabledByPipeline = (pipelineNotFinished && !isStepComplete(key));

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
                              <Text
                                type='secondary'

                              >
                                <CloseOutlined />
                              </Text>
                              <span
                                style={{ marginLeft: '0.25rem', textDecoration: 'line-through' }}
                              >
                                {name}
                              </span>
                            </>
                          ) : !disabledByPipeline ? (
                            <>
                              <Text
                                type='success'

                              >
                                <CheckOutlined />
                              </Text>
                              <span
                                style={{ marginLeft: '0.25rem' }}
                              >
                                {name}
                              </span>
                            </>
                          ) : pipelineRunning && !isStepComplete(key) ? (
                            <>
                              <Text
                                type='warning'
                                strong
                              >
                                <EllipsisOutlined />
                              </Text>
                              <span style={{ marginLeft: '0.25rem' }}>{name}</span>
                            </>
                          ) : pipelineNotFinished && !pipelineRunning && !isStepComplete(key) ? (
                            <>
                              <Text
                                type='danger'
                                strong
                              >
                                <WarningOutlined />
                              </Text>
                              <span style={{ marginLeft: '0.25rem' }}>{name}</span>
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
                  onClick={() => {
                    dispatch(updateProcessingSettings(
                      experimentId,
                      steps[stepIdx].key,
                      { enabled: !processingConfig[steps[stepIdx].key]?.enabled },
                    ));
                    dispatchDebounce(saveProcessingSettings(experimentId, steps[stepIdx].key));
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
                  type='primary'
                  onClick={() => { onPipelineRun(steps[stepIdx].key) }}
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
                  disabled={stepIdx === 0}
                  icon={<LeftOutlined />}
                  onClick={() => changeStepId(Math.max(stepIdx - 1, 0))}
                >
                  Previous
                </Button>
                {stepIdx !== steps.length - 1 ? (
                  <Button
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
