import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Link from 'next/link';
import {
  Select, Space, Button, Typography, Alert,
  Row, Col, Card, Skeleton,
  Tooltip, Modal
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

import getUserFriendlyQCStepName from '../../../../utils/getUserFriendlyQCStepName';

import {
  loadProcessingSettings, saveProcessingSettings, setQCStepEnabled,
  addChangedQCFilter, discardChangedQCFilters
} from '../../../../redux/actions/experimentSettings';

import loadCellSets from '../../../../redux/actions/cellSets/loadCellSets';
import { loadSamples } from '../../../../redux/actions/samples'
import { runPipeline } from '../../../../redux/actions/pipeline';
import PipelineRedirectToDataProcessing from '../../../../components/PipelineRedirectToDataProcessing';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = ({ experimentId, experimentData, route }) => {
  const dispatch = useDispatch();

  const completedPath = '/experiments/[experimentId]/data-exploration';

  const pipelineStatus = useSelector((state) => state.experimentSettings.backendStatus.status.pipeline);
  const processingConfig = useSelector((state) => state.experimentSettings.processing);
  const samples = useSelector((state) => state.samples)

  const pipelineStatusKey = pipelineStatus?.status;
  const pipelineRunning = pipelineStatusKey === 'RUNNING';

  // Pipeline is not loaded (either running or in an errored state)
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];
  const pipelineHadErrors = pipelineErrors.includes(pipelineStatusKey);
  const pipelineNotFinished = pipelineRunning || pipelineHadErrors;

  const completedSteps = pipelineStatus?.completedSteps;

  const cellSets = useSelector((state) => state.cellSets);
  const changedQCFilters = useSelector((state) => state.experimentSettings.processing.meta.changedQCFilters);

  const changesOutstanding = Boolean(changedQCFilters.size);

  const [stepIdx, setStepIdx] = useState(0);
  const [applicableFilters, setApplicableFilters] = useState([])
  const [preFilteredSamples, setPreFilteredSamples] = useState([])
  const [stepDisabledByCondition, setStepDisabledByCondition] = useState(false)
  const [runQCModalVisible, setRunQCModalVisible] = useState(false);

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

    dispatch(loadProcessingSettings(experimentId));
  }, []);

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
        dispatch(setQCStepEnabled(step, false));
        dispatch(saveProcessingSettings(experimentId, step))
      })
    }

  }, [stepIdx, preFilteredSamples, processingConfig.meta])

  useEffect(() => {
    if (sampleKeys && sampleKeys.length === 1) {
      disableStepsOnCondition.unisample.forEach((step) => {
        dispatch(setQCStepEnabled(step, false));
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

  // Checks if the step is in the 'completed steps' list we get from the pipeline status
  const isStepComplete = (stepName) => {
    if (stepName === undefined) {
      return true
    }

    const lowerCaseStepName = stepName.toLowerCase();

    const stepAppearances = _.filter(completedSteps, (stepPipelineName) => {
      return stepPipelineName.toLowerCase().includes(lowerCaseStepName);
    });

    return stepAppearances.length > 0;
  }

  const onConfigChange = (key) => {
    dispatch(addChangedQCFilter(key));
  };

  const inputsList = sampleKeys?.map((key) => ({ key, headerName: `Sample ${cellSets.properties?.[key].name}`, params: { ...cellSets.properties?.[key], key } }));

  const steps = [
    {

      key: 'classifier',
      name: getUserFriendlyQCStepName('classifier'),
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
              onConfigChange={() => onConfigChange(key)}
              stepDisabled={!processingConfig[key]?.enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'cellSizeDistribution',
      name: getUserFriendlyQCStepName('cellSizeDistribution'),
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
              onConfigChange={() => onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'mitochondrialContent',
      name: getUserFriendlyQCStepName('mitochondrialContent'),
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
              onConfigChange={() => onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'numGenesVsNumUmis',
      name: getUserFriendlyQCStepName('numGenesVsNumUmis'),
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
              onConfigChange={() => onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'doubletScores',
      name: getUserFriendlyQCStepName('doubletScores'),
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
              onConfigChange={() => onConfigChange(key)}
              stepDisabled={!processingConfig[key].enabled}
            />
          )}
        />
      ),
    },
    {
      key: 'dataIntegration',
      name: getUserFriendlyQCStepName('dataIntegration'),
      multiSample: false,
      render: (key, expId) => (
        <DataIntegration
          experimentId={expId}
          key={key}
          onConfigChange={() => onConfigChange(key)}
          disableDataIntegration={sampleKeys && sampleKeys.length === 1}
        />
      ),
    },
    {
      key: 'configureEmbedding',
      name: getUserFriendlyQCStepName('configureEmbedding'),
      description: 'Single cell data is very complex. To visualize the relationship (similarity) between cells, we need to reduce this complexity (dimension reduction) to be able to plot (embedd into 2D space).',
      multiSample: false,
      render: (key, expId) => (
        <ConfigureEmbedding
          experimentId={expId}
          key={key}
          onPipelineRun={() => onPipelineRun()}
          onConfigChange={() => onConfigChange(key)}
        />
      ),
    },
  ];

  const changeStepId = (newStepIdx) => {
    setStepIdx(newStepIdx);
  }

  const renderRunButton = (runMessage) => (
    <Tooltip title='Run data processing with the changed settings'>
      <Button
        id='runFilterButton'
        data-testid='runFilterButton'
        type='primary'
        onClick={() => setRunQCModalVisible(true)}
        style={{ minWidth: '80px' }}
      >
        {runMessage}
      </Button>
    </Tooltip>
  );

  const renderRunOrDiscardButtons = () => {
    if (pipelineHadErrors) {
      return renderRunButton('Run Data Processing');
    } else if (changesOutstanding) {
      return (
        <Alert
          message={<>Your new settings are <br />not yet applied</>}
          type='info'
          showIcon
          style={{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '10px', paddingRight: '10px' }}
          action={
            <Space size='small'>
              {renderRunButton('Run')}
              <Tooltip title='Discard your changes since the last run'>
                <Button
                  id='discardChangesButton'
                  data-testid='discardChangesButton'
                  type='primary'
                  onClick={() => { dispatch(discardChangedQCFilters()); }}
                  style={{ width: '80px' }}
                >
                  Discard
                </Button>
              </Tooltip>
            </Space >
          }
        >
        </Alert >
      );
    }

    return;
  };

  // Called when the pipeline is triggered to be run by the user.
  const onPipelineRun = () => {
    dispatch(runPipeline(experimentId))
  }

  const renderTitle = () => (
    <>
      <Row style={{ display: 'flex' }}>
        <Col style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }} span={7}>
          <Row style={{ display: 'flex' }} gutter={10}>
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
                    dispatch(setQCStepEnabled(steps[stepIdx].key, !processingConfig[steps[stepIdx].key]?.enabled));
                    dispatch(saveProcessingSettings(experimentId, steps[stepIdx].key));
                  }}>
                  {
                    !processingConfig[steps[stepIdx].key]?.enabled
                      ? 'Enable' : 'Disable'
                  }
                </Button>
              )}
            </Col>
          </Row>
        </Col>
        <Col style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Row>
            <Col style={{ marginLeft: 'auto', marginRight: '10px' }}>
              {renderRunOrDiscardButtons()}
            </Col>
            <Col style={{ minHeight: '100%', alignItems: 'center', display: 'flex' }}>
              <Space>
                <StepsIndicator
                  allSteps={steps}
                  currentStep={stepIdx}
                  completedSteps={completedSteps.length}
                />
                <Text>{`${completedSteps.length} of ${steps.length} steps complete`}</Text>
              </Space>
            </Col>
            <Col style={{ alignItems: 'center', display: 'flex' }}>
              <StatusIndicator />
            </Col>
            <Col style={{ marginLeft: 'auto', alignItems: 'center', display: 'flex' }}>
              <Space size='middle'>
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

  const renderContent = () => {
    const { render, key } = steps[stepIdx];

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
              onClick={() => { onPipelineRun() }}
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
      <Space direction='vertical' style={{ width: '100%' }}>
        {processingConfig[steps[stepIdx].key]?.enabled === false && stepDisabledByCondition &&
          applicableFilters.map(filter =>
            <Alert
              message={disabledConditionMessage[filter]}
              type="info"
              showIcon
            />
          )
        }

        {processingConfig[steps[stepIdx].key]?.enabled === false && !stepDisabledByCondition &&
          (
            <Alert
              message={'This filter is disabled. You can still modify and save changes, but the filter will not be applied to your data.'}
              type="info"
              showIcon
            />
          )
        }

        {render(key, experimentId)}
      </Space>
    );
  }

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
      <Modal title='Run data processing with the changed settings'
        visible={runQCModalVisible}
        onCancel={() => setRunQCModalVisible(false)}
        onOk={() => onPipelineRun()}
        okText='Start'
      >
        <p>This will take several minutes. Your navigation within Cellscope will be restricted during this time. Do you want to start?</p>
      </Modal>
      <Card
        title={renderTitle()}
      >
        {renderContent()}
      </Card>
    </div>
  );
};

DataProcessingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  route: PropTypes.string.isRequired,
};

export default DataProcessingPage;
