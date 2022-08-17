import {
  Alert,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EllipsisOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  addChangedQCFilter,
  discardChangedQCFilters,
  loadProcessingSettings,
  saveProcessingSettings,
  setQCStepEnabled,
} from 'redux/actions/experimentSettings';
import { getUserFriendlyQCStepName, qcSteps } from 'utils/qcSteps';
import { useDispatch, useSelector } from 'react-redux';

import CellSizeDistribution from 'components/data-processing/CellSizeDistribution/CellSizeDistribution';
import Classifier from 'components/data-processing/Classifier/Classifier';
import ConfigureEmbedding from 'components/data-processing/ConfigureEmbedding/ConfigureEmbedding';
import DataIntegration from 'components/data-processing/DataIntegration/DataIntegration';
import DoubletScores from 'components/data-processing/DoubletScores/DoubletScores';
import GenesVsUMIs from 'components/data-processing/GenesVsUMIs/GenesVsUMIs';
import Header from 'components/Header';
import MitochondrialContent from 'components/data-processing/MitochondrialContent/MitochondrialContent';
import PipelineRedirectToDataProcessing from 'components/PipelineRedirectToDataProcessing';
import PlatformError from 'components/PlatformError';
import PropTypes from 'prop-types';
import SingleComponentMultipleDataContainer from 'components/SingleComponentMultipleDataContainer';
import StatusIndicator from 'components/data-processing/StatusIndicator';
import _ from 'lodash';
import { getBackendStatus } from 'redux/selectors';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadSamples } from 'redux/actions/samples';
import { cloneExperiment, loadExperiments } from 'redux/actions/experiments';
import { runQC } from 'redux/actions/pipeline';

import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';
import config from 'config/defaultConfig';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = ({ experimentId, experimentData }) => {
  const dispatch = useDispatch();
  const { navigateTo } = useAppRouter();

  const pipelineStatus = useSelector(getBackendStatus(experimentId))?.status?.pipeline;

  const processingConfig = useSelector((state) => state.experimentSettings.processing);
  const {
    sampleIds: sampleKeys,
    pipelineVersion,
  } = useSelector((state) => state.experimentSettings.info);

  const samples = useSelector((state) => state.samples);

  const pipelineStatusKey = pipelineStatus?.status;
  const pipelineRunning = pipelineStatusKey === 'RUNNING';

  // Pipeline is not loaded (either running or in an errored state)
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];
  const pipelineHadErrors = pipelineErrors.includes(pipelineStatusKey);
  const pipelineNotFinished = pipelineRunning || pipelineHadErrors;

  const completedSteps = pipelineStatus?.completedSteps || [];

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const changesOutstanding = Boolean(changedQCFilters.size);
  const qcRerunDisabled = pipelineVersion < config.pipelineVersion;

  const [stepIdx, setStepIdx] = useState(0);
  const [runQCModalVisible, setRunQCModalVisible] = useState(false);
  const [inputsList, setInputsList] = useState([]);

  useEffect(() => {
    // If processingConfig is not loaded then reload
    if (Object.keys(processingConfig).length <= 1) {
      dispatch(loadProcessingSettings(experimentId));
    }

    dispatch(loadSamples(experimentId));
    dispatch(loadCellSets(experimentId));
  }, []);

  // Checks if the step is in the 'completed steps' list we get from the pipeline status
  const isStepComplete = (stepName) => {
    if (stepName === undefined) {
      return true;
    }

    const lowerCaseStepName = stepName.toLowerCase();

    const stepAppearances = _.filter(
      completedSteps,
      (stepPipelineName) => stepPipelineName.toLowerCase().includes(lowerCaseStepName),
    );

    return stepAppearances.length > 0;
  };

  const onConfigChange = useCallback((key) => {
    dispatch(addChangedQCFilter(key));
  });

  const prefixSampleName = (name) => {
    // eslint-disable-next-line no-param-reassign
    if (!name.match(/$sample/ig)) name = `Sample ${name}`;
    return name;
  };

  useEffect(() => {
    if (sampleKeys && sampleKeys.length > 0 && Object.keys(samples).filter((key) => key !== 'meta').length > 0) {
      const list = sampleKeys?.map((sampleId) => ({
        key: sampleId,
        headerName: prefixSampleName(samples[sampleId].name),
        params: { key: sampleId },
      }));
      setInputsList(list);
    }
  }, [samples, sampleKeys]);

  const steps = [
    {

      key: 'classifier',
      name: getUserFriendlyQCStepName('classifier'),
      description: 'The Classifier filter is based on the ‘emptyDrops’ method which distinguishes between droplets containing cells and ambient RNA. Droplets are filtered based on the False Discovery Rate (FDR) value - the red line on the density plot. In the knee plot, the ‘mixed’ population shown in grey contains some cells that are filtered out and some that remain and can be filtered further in the next filter.',
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <Classifier
              id='classifier'
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
      description: 'A high percentage of mitochondrial reads is an indicator of cell death. UMIs mapped to mitochondrial genes are calculated as a percentage of total UMIs. The percentage of mitochondrial reads depends on the cell type. The typical cut-off range is 10-50%, with the default cut-off set to 3 median absolute deviations above the median.',
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
      description:
  <span>
    Droplets may contain more than one cell.
    In such cases, it is not possible to distinguish which reads came from which cell.
    Such “cells” cause problems in the downstream analysis as they appear as an intermediate type.
    “Cells” with a high probability of being a doublet should be excluded.
    The probability of being a doublet is calculated using ‘scDblFinder’.
    For each sample, the default threshold tries to minimize both the deviation in the
    expected number of doublets and the error of a trained classifier. For more details see
    {' '}
    <a href='https://bioconductor.org/packages/devel/bioc/vignettes/scDblFinder/inst/doc/scDblFinder.html#thresholding' rel='noreferrer' target='_blank'>scDblFinder thresholding</a>
    .
  </span>,
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
      description: 'Cells and clusters are visualized in a 2-dimensional embedding. The UMAP or t-SNE embedding plot can be selected and customized. The clustering method (e.g. Louvain) and resolution are set here.',
      multiSample: false,
      render: (key, expId) => (
        <ConfigureEmbedding
          experimentId={expId}
          key={key}
          onConfigChange={() => onConfigChange(key)}
        />
      ),
    },
  ];

  const currentStep = steps[stepIdx];

  // check that the order and identities of the QC steps above match
  // the canonical representation
  console.assert(_.isEqual(qcSteps, steps.map((s) => s.key)));

  const changeStepId = (newStepIdx) => {
    setStepIdx(newStepIdx);
  };

  const renderRunButton = (runMessage, useSmall = true) => (
    <Tooltip title='Run data processing with the changed settings'>
      <Button
        data-testid='runFilterButton'
        type='primary'
        onClick={() => setRunQCModalVisible(true)}
        style={{ minWidth: '80px' }}
        size={useSmall ? 'small' : 'medium'}
      >
        {runMessage}
      </Button>
    </Tooltip>
  );

  const renderRunOrDiscardButtons = () => {
    if (pipelineHadErrors) {
      return renderRunButton('Run Data Processing', false);
    } if (changesOutstanding) {
      return (
        <Alert
          message={<>Your new settings are not yet applied</>}
          type='info'
          showIcon
          style={{
            paddingTop: '3px', paddingBottom: '3px', paddingLeft: '10px', paddingRight: '10px',
          }}
          action={(
            <Space size='small'>
              {renderRunButton('Run', true)}
              <Tooltip title='Discard your changes since the last run'>
                <Button
                  id='discardChangesButton'
                  data-testid='discardChangesButton'
                  type='primary'
                  onClick={() => { dispatch(discardChangedQCFilters()); }}
                  style={{ width: '80px' }}
                  size='small'
                >
                  Discard
                </Button>
              </Tooltip>
            </Space>
          )}
        />
      );
    }
  };

  // Called when the pipeline is triggered to be run by the user.
  const onPipelineRun = () => {
    setRunQCModalVisible(false);
    dispatch(runQC(experimentId));
  };

  const renderTitle = () => {
    const stepEnabled = processingConfig[currentStep.key]?.enabled;
    const prefiltered = processingConfig[currentStep.key]?.prefiltered || false;

    return (
      <>
        <Row justify='space-between'>
          <Col style={{ paddingBottom: '8px' }}>
            {/* Should be just wide enough that no ellipsis appears */}
            <Row>
              <Col style={{ paddingBottom: '8px', paddingRight: '8px' }}>
                <Space size='small'>
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
                              ) : pipelineNotFinished
                                && !pipelineRunning
                                && !isStepComplete(key) ? (
                                  <>
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
                        },
                      )
                    }
                  </Select>
                  {currentStep.description && (
                    <Tooltip title={currentStep.description}>
                      <Button icon={<InfoCircleOutlined />} />
                    </Tooltip>
                  )}
                  {currentStep.multiSample && (
                    <Tooltip title={`${!stepEnabled ? 'Enable this filter' : 'Disable this filter'}`}>
                      <Button
                        disabled={prefiltered}
                        data-testid='enableFilterButton'
                        onClick={async () => {
                          await dispatch(saveProcessingSettings(experimentId, currentStep.key));
                          if (!processingConfig.meta.saveSettingsError) {
                            dispatch(setQCStepEnabled(
                              currentStep.key, !stepEnabled,
                            ));
                          }
                        }}
                      >
                        {
                          stepEnabled ? 'Disable' : 'Enable'
                        }
                      </Button>
                    </Tooltip>
                  )}
                </Space>
              </Col>
              <Col>
                {renderRunOrDiscardButtons()}
              </Col>
            </Row>
          </Col>
          <Col>
            <Row align='middle' justify='space-between'>
              <Col>
                <StatusIndicator
                  experimentId={experimentId}
                  allSteps={steps}
                  currentStep={stepIdx}
                  completedSteps={completedSteps}
                />
                <Space size='small'>
                  <Tooltip title='Previous'>
                    <Button
                      data-testid='pipelinePrevStep'
                      disabled={stepIdx === 0}
                      icon={<LeftOutlined />}
                      onClick={() => changeStepId(Math.max(stepIdx - 1, 0))}
                      size='small'
                    />
                  </Tooltip>
                  {stepIdx !== steps.length - 1 ? (
                    <Tooltip title='Next'>
                      <Button
                        data-testid='pipelineNextStep'
                        onClick={() => {
                          const newStepIdx = Math.min(stepIdx + 1, steps.length - 1);
                          changeStepId(newStepIdx);
                        }}
                        disabled={steps[stepIdx + 1] !== undefined
                          && pipelineNotFinished
                          && !isStepComplete(steps[stepIdx + 1].key)}
                        icon={<RightOutlined />}
                        size='small'
                      />
                    </Tooltip>
                  )
                    : (
                      <Tooltip title='Finish QC'>
                        <Button
                          type='primary'
                          disabled={steps[stepIdx + 1]
                            && pipelineNotFinished
                            && !isStepComplete(steps[stepIdx + 1].key)}
                          icon={<CheckOutlined />}
                          size='small'
                          onClick={() => navigateTo(modules.DATA_EXPLORATION, { experimentId })}
                        />
                      </Tooltip>
                    )}
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  };

  const renderContent = () => {
    const { render, key } = currentStep;

    if (pipelineRunning && !isStepComplete(key)) {
      return <div><PipelineRedirectToDataProcessing pipelineStatus='runningStep' /></div>;
    }

    if (pipelineNotFinished && !isStepComplete(key)) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PlatformError
              description={'We don\'t have anything for this step.'}
              reason='The last run ended before this step could be finished.'
              onClick={() => { onPipelineRun(); }}
            />
          </div>
        </div>
      );
    }

    if (samples.meta.loading
      || processingConfig.meta.loading
      || Object.keys(processingConfig).length <= 1
    ) {
      return (
        <div className='preloadContextSkeleton' style={{ padding: '16px 0px' }}>
          <Skeleton.Input style={{ width: '100%', height: 400 }} active />
        </div>
      );
    }

    if (samples.meta.error || processingConfig.meta.loadingSettingsError) {
      return (
        <PlatformError
          error={samples.meta.error.toString()
            || processingConfig.meta.loadingSettingsError.toString()}
          onClick={() => { dispatch(loadSamples(experimentId)); }}
        />
      );
    }

    return (
      <Space direction='vertical' style={{ width: '100%' }}>
        {
          'enabled' in processingConfig[key] && !processingConfig[key].enabled ? (
            <Alert
              message={processingConfig[key]?.prefiltered
                ? 'This filter is disabled because the one of the sample(s) is pre-filtered. Click \'Next\' to continue processing your data.'
                : 'This filter is disabled. You can still modify and save changes, but the filter will not be applied to your data.'}
              type='info'
              showIcon
            />
          ) : <></>
        }

        {render(key, experimentId)}
      </Space>
    );
  };

  const cloneExperimentAndSelectIt = async () => {
    dispatch(discardChangedQCFilters());
    const newExperimentId = await dispatch(cloneExperiment(experimentId, `Clone of ${experimentData.experimentName}`));
    await dispatch(loadExperiments());

    navigateTo(modules.DATA_MANAGEMENT, { experimentId: newExperimentId }, true);
  };

  const qcRerunDisabledAlert = () => (
    <>
      <p>
        Due to a recent update, re-running the pipeline will initiate the run from the beginning
        and you will lose all of your annotated cell sets. You have 3 options:
      </p>
      <ul>
        <li>
          Click
          <Text code>Start</Text>
          {' '}
          to re-run this project analysis from the beginning. Note that you will
          lose all of your annotated cell sets.
        </li>
        <li>
          Click
          <Text code>Clone Project</Text>
          {' '}
          to clone this project and run from the beginning for the new project only.
          Your current project will not re-run, and will still be available to explore.
        </li>
        <li>
          Click
          <Text code>Cancel</Text>
          {' '}
          to close this popup. You can then choose to discard the changed
          settings in your current project.
        </li>
      </ul>
    </>
  );

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Data Processing'
      />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>
        {runQCModalVisible && (
          <Modal
            title='Run data processing with the changed settings'
            visible
            onCancel={() => setRunQCModalVisible(false)}
            footer={
              [
                <Button type='primary' onClick={() => onPipelineRun()}>Start</Button>,
                qcRerunDisabled ? <Button type='primary' onClick={() => cloneExperimentAndSelectIt()}>Clone Project</Button> : <></>,
                <Button onClick={() => setRunQCModalVisible(false)}>Cancel</Button>,
              ]
            }
          >
            {qcRerunDisabled && qcRerunDisabledAlert()}
            <p>
              This might take several minutes.
              Your navigation within Cellenics will be restricted during this time.
              Do you want to start?
            </p>
          </Modal>
        )}
        <Card
          title={renderTitle()}
        >
          {renderContent()}
        </Card>
      </Space>
    </>
  );
};

DataProcessingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default DataProcessingPage;
