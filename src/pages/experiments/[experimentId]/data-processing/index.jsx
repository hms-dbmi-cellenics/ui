import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Link from 'next/link';
import {
  Select, Space, Button, Typography, Alert,
  Row, Col, Carousel, Card, Modal, Skeleton,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  CloseOutlined,
  EllipsisOutlined,
  WarningOutlined
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
import Loader from '../../../../components/Loader';

import StepsIndicator from '../../../../components/data-processing/StepsIndicator';
import StatusIndicator from '../../../../components/data-processing/StatusIndicator';

import SingleComponentMultipleDataContainer from '../../../../components/SingleComponentMultipleDataContainer';
import { loadProcessingSettings, updateProcessingSettings, saveProcessingSettings } from '../../../../redux/actions/experimentSettings';
import loadCellSets from '../../../../redux/actions/cellSets/loadCellSets';
import { runPipeline } from '../../../../redux/actions/pipeline';
import PreloadContent from '../../../../components/PreloadContent';
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

  const pipelineStatusKey = pipelineStatus.pipeline?.status;

  const pipelineRunning = pipelineStatusKey === 'RUNNING';

  // Pipeline is not loaded (either running or in an errored state)
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];
  const pipelineNotFinished = pipelineRunning || pipelineErrors.includes(pipelineStatusKey);

  const completedSteps = pipelineStatus.pipeline?.completedSteps;

  const cellSets = useSelector((state) => state.cellSets);

  const [changesOutstanding, setChangesOutstanding] = useState(false);
  const [showChangesWillBeLost, setShowChangesWillBeLost] = useState(false);

  const upcomingStepIdxRef = useRef(null);

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (experimentId) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  const sampleKeys = cellSets.hierarchy?.find(
    (rootNode) => (rootNode.key === 'sample'),
  )?.children.map(
    (child) => child.key,
  );

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
      key: 'cellSizeDistribution',
      name: 'Cell size distribution filter',
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <CellSizeDistribution
              id={'cellSizeDistribution'}
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={onConfigChange}
            />
          )}
        />
      ),
    },
    {
      key: 'mitochondrialContent',
      name: 'Mitochondrial content filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'classifier',
      name: 'Classifier filter',
      multiSample: true,
      render: (key) => (
        <SingleComponentMultipleDataContainer
          defaultActiveKey={sampleKeys}
          inputsList={inputsList}
          baseComponentRenderer={(sample) => (
            <Classifier
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              onConfigChange={onConfigChange}
            />
          )}
        />
      ),
    },
    {
      key: 'numGenesVsNumUmis',
      name: 'Number of genes vs UMIs filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'doubletScores',
      name: 'Doublet filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'dataIntegration',
      name: 'Data integration',
      multiSample: false,
      render: (key, expId) => <DataIntegration experimentId={expId} key={key} onPipelineRun={() => onPipelineRun(key)} />,
    },
    {
      key: 'computeEmbedding',
      name: 'Compute embedding',
      multiSample: false,
      render: (key, expId) => <ConfigureEmbedding experimentId={expId} key={key} onPipelineRun={() => onPipelineRun(key)} />,
    },
  ];

  const [stepIdx, setStepIdx] = useState(0);

  const carouselRef = useRef(null);

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
      <Row justify='space-between'>
        <Col span='14' >
          <Row>
            <Space>
              <Select
                value={stepIdx}
                onChange={(idx) => {
                  changeStepId(idx);
                }}
                style={{ width: 360, fontWeight: 'bold' }}
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
                              // style={!processingConfig[key]?.enabled ? { textDecoration: 'line-through' } : {}}
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

              {steps[stepIdx].multiSample && (
                <>
                  <Button
                    onClick={() => {
                      dispatch(updateProcessingSettings(
                        experimentId,
                        steps[stepIdx].key,
                        { enabled: !processingConfig[steps[stepIdx].key]?.enabled },
                      ));

                      dispatchDebounce(saveProcessingSettings(experimentId, steps[stepIdx].key));
                    }}>
                    {processingConfig[steps[stepIdx].key]?.enabled === false ? 'Enable' : 'Disable'}
                  </Button>
                  <Button
                    id='runFilterButton'
                    type='primary'
                    onClick={() => { onPipelineRun(steps[stepIdx].key) }}
                    disabled={!pipelineErrors.includes(pipelineStatusKey) && !changesOutstanding}
                    style={{ marginLeft: '20px' }}
                  >
                    {pipelineErrors.includes(pipelineStatusKey) ? 'Run Data Processing' : 'Save changes'}
                  </Button>
                </>
              )}
            </Space>
          </Row>
        </Col>
        <Col span='10'>
          <div style={{ float: 'right' }}>
            <Space size='large'>

              <StepsIndicator
                allSteps={steps}
                currentStep={stepIdx}
                completedSteps={completedSteps.length}
              />
              <Text type='primary'>{`${completedSteps.length} of ${steps.length} steps complete`}</Text>
              <StatusIndicator />
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
          </div>
        </Col>
      </Row >
    </>
  );

  return (
    <div style={{
      paddingLeft: 32, paddingRight: 32, display: 'flex', flexDirection: 'column', minHeight: '100vh',
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
        style={{ flex: 1 }}
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
                      description={'Details about this step are not available.'}
                      onClick={() => { onPipelineRun(steps[stepIdx].key) }}
                    />
                  </div>
                </div>
              );
            }

            if (cellSets.loading) {
              return (
                <div className='preloadContextSkeleton' style={{ padding: '16px 0px' }}>
                  <Skeleton.Input style={{ width: '100%', height: 400 }} active />
                </div>
              );
            }

            if (cellSets.error) {
              return (
                <PlatformError
                  error={cellSets.error.toString()}
                  onClick={() => { dispatch(loadCellSets(experimentId)); }}
                />
              );
            }

            return (
              <Space direction='vertical' style={{ width: '100%' }}>
                {processingConfig[steps[stepIdx].key].enabled === false &&
                  <Alert
                    message="This filter is disabled. You can still modify and save changes, but the filter will not be applied to your data."
                    type="info"
                    showIcon
                  />
                }
                {render(key, experimentId)}
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
