import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Link from 'next/link';
import {
  Select, Space, Button, Typography, Alert,
  Progress, Row, Col, Carousel, Card, Modal
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  CaretRightOutlined,
  EllipsisOutlined,
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

import SingleComponentMultipleDataContainer from '../../../../components/SingleComponentMultipleDataContainer';
import { updateCompletedSteps, loadProcessingSettings } from '../../../../redux/actions/experimentSettings';
import loadCellSets from '../../../../redux/actions/cellSets/loadCellSets';
import { runPipeline } from '../../../../redux/actions/pipeline';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = ({ experimentId, experimentData, route }) => {
  const dispatch = useDispatch();

  const completedPath = '/experiments/[experimentId]/data-exploration';

  const {
    loading,
    stepsDone: completedSteps,
    loadingSettingsError,
    completingStepError,
  } = useSelector((state) => state.experimentSettings.processing.meta);

  const {
    status: pipelineStatus,
  } = useSelector((state) => state.experimentSettings.pipelineStatus);

  const pipelineStatusKey = pipelineStatus.pipeline?.status;
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];

  const pipelineRunning = pipelineStatusKey === 'RUNNING';

  const pipelineBlockingSteps = pipelineRunning || pipelineErrors.includes(pipelineStatusKey);

  const pipelineRunningCompletedSteps = pipelineStatus.pipeline?.completedSteps;

  const cellSets = useSelector((state) => state.cellSets);

  const [changesOutstanding, setChangesOutstanding] = useState(false);
  const [showChangesWillBeLost, setShowChangesWillBeLost] = useState(false);

  const upcomingStepIdxRef = useRef(null);

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (loading && !loadingSettingsError) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  const sampleKeys = cellSets.hierarchy?.find(
    (rootNode) => (rootNode.key === 'sample'),
  )?.children.map(
    (child) => child.key,
  );

  // Checks if the step is in the 'completed steps' list we get from the pipeline status
  const stepIsCompletedInPipeline = (stepName) => {
    const lowerCaseStepName = stepName.toLowerCase();

    const stepAppearances = _.filter(pipelineRunningCompletedSteps, (stepPipelineName) => {
      return stepPipelineName.toLowerCase().includes(lowerCaseStepName);
    });

    return stepAppearances.length > 0;
  }

  const configChangedHandler = () => {
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
              id='cellSizeDistribution'
              experimentId={experimentId}
              filtering
              key={key}
              sampleId={sample.key}
              sampleIds={sampleKeys}
              configChangedHandler={configChangedHandler}
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
              configChangedHandler={configChangedHandler}
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
              configChangedHandler={configChangedHandler}
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
              configChangedHandler={configChangedHandler}
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
              configChangedHandler={configChangedHandler}
            />
          )}
        />
      ),
    },
    {
      key: 'dataIntegration',
      name: 'Data integration',
      multiSample: false,
      render: (key) => <DataIntegration key={key} pipelineRunHandler={() => pipelineRunHandler(key)} />,
    },
    {
      key: 'computeEmbedding',
      name: 'Compute embedding',
      multiSample: false,
      render: (key, expId) => <ConfigureEmbedding experimentId={expId} key={key} pipelineRunHandler={() => pipelineRunHandler(key)} />,
    },
  ];

  // If the pipeline is running we can't focus on the next step because it is showing outdated information
  // If the pipeline isn't running we should show the next step to complete
  const stepToFocus = () => {
    return pipelineRunning ? Math.max(0, completedSteps.size - 1) : completedSteps.size % steps.length;
  }

  const [stepIdx, setStepIdx] = useState(completedSteps.size % steps.length);

  const carouselRef = useRef(null);

  useEffect(() => {
    setStepIdx(stepToFocus());
  }, [loading]);

  useEffect(() => {
    const goToStepIdx = () => {
      if (carouselRef.current) {
        carouselRef.current.goTo(stepIdx, true);
      }
    };

    const completeProcessingStepIfAdvanced = () => {
      if (stepIdx > completedSteps.size) {
        completeStepAt(stepIdx - 1);
      }
    };

    goToStepIdx();
    completeProcessingStepIfAdvanced();
  }, [stepIdx]);

  useEffect(() => {
    if (completingStepError && stepIdx > completedSteps.size) {
      setStepIdx(completedSteps.size);
      return;
    }
  }, [completingStepError, stepIdx,]);

  const manualStepIdxChange = (newStepIdx) => {
    if (changesOutstanding) {
      upcomingStepIdxRef.current = newStepIdx;

      setShowChangesWillBeLost(true);
    } else {
      setStepIdx(newStepIdx);
    }
  }

  let nextDisabledByPipeline = false;

  if (steps[stepIdx + 1]) {
    const { key: nextKey } = steps[stepIdx + 1];

    // We disable the next 
    nextDisabledByPipeline = pipelineBlockingSteps && !stepIsCompletedInPipeline(nextKey) && !completedSteps.has(nextKey);
  }

  const completeStepAt = (stepIndex) => {
    const newDoneStepKey = steps[stepIndex].key;

    const newStepsDone = new Set([...completedSteps, newDoneStepKey]);

    dispatch(updateCompletedSteps(experimentId, newStepsDone, steps.length));
  }

  const setCompletedStepsFrom = (calledFromStepKey) => {
    let newStepsDone = [];

    steps.forEach((step) => {
      newStepsDone.push(step.key);

      if (step.key === calledFromStepKey) {
        dispatch(updateCompletedSteps(experimentId, newStepsDone, steps.length))
        return;
      }
    });
  }

  const pipelineRunHandler = (calledFromStepKey) => {
    setCompletedStepsFrom(calledFromStepKey);
    setChangesOutstanding(false);

    dispatch((runPipeline(experimentId, calledFromStepKey)))
  }

  const ignoreLostChanges = () => {
    setShowChangesWillBeLost(false)
    setChangesOutstanding(false);
    setStepIdx(upcomingStepIdxRef.current);
  }

  const renderTitle = () => (
    <>
      <Modal
        title="Basic Modal"
        visible={showChangesWillBeLost}
        onOk={ignoreLostChanges}
        onCancel={() => setShowChangesWillBeLost(false)}
        okText='Continue'
        cancelText='Cancel'
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
      <Row justify='space-between'>
        <Col span='14' >
          <Row>
            <Select
              value={stepIdx}
              onChange={(idx) => {
                manualStepIdxChange(idx);
              }}
              style={{ width: 360, fontWeight: 'bold' }}
              placeholder='Jump to a step...'
            >
              {
                steps.map(
                  ({ name, key }, i) => {
                    const disabledByPipeline = (pipelineBlockingSteps && !stepIsCompletedInPipeline(key)) && !completedSteps.has(key);

                    return (
                      <Option
                        value={i}
                        key={key}
                        disabled={
                          disabledByPipeline
                          || (!completedSteps.has(key)
                            && i !== completedSteps.size
                            && i !== stepIdx + 1)
                        }
                      >
                        {!disabledByPipeline && completedSteps.has(key) && (
                          <>
                            <Text
                              type='success'
                            >
                              <CheckOutlined />
                            </Text>
                            <span style={{ marginLeft: '0.25rem' }}>{name}</span>
                          </>
                        )}

                        {!disabledByPipeline && !completedSteps.has(key) && completedSteps.size === i && (
                          <Text
                            type='default'
                          >
                            <CaretRightOutlined />
                            <span style={{ marginLeft: '0.25rem' }}>{name}</span>
                          </Text>
                        )}

                        {(disabledByPipeline || (!completedSteps.has(key) && completedSteps.size < i)) && (
                          <>
                            <Text
                              disabled
                            >
                              <EllipsisOutlined />
                            </Text>
                            <span style={{ marginLeft: '0.25rem' }}>{name}</span>
                          </>
                        )}
                      </Option>
                    );
                  }
                )
              }
            </Select>

            {steps[stepIdx].multiSample && (
              <Button
                id='runFilterButton'
                type='primary'
                onClick={() => { pipelineRunHandler(steps[stepIdx].key) }}
                disabled={!changesOutstanding || pipelineRunning}
                style={{ marginLeft: '20px' }}
              >
                Run filter
              </Button>
            )}

            {changesOutstanding && (
              <Alert
                message='Your changes have not been applied. To rerun Click Run Filter.'
                type='warning'
                showIcon={false}
                style={{ marginLeft: '20px', width: '440px' }}
              />
            )}

          </Row>
        </Col>
        <Col span='10'>
          <div style={{ float: 'right' }}>
            <Space size='large'>
              <Progress
                percent={((completedSteps.size) / steps.length) * 100}
                steps={steps.length}
                showInfo={false}
              />
              <Text type='primary'>{`${completedSteps.size} of ${steps.length} steps complete`}</Text>
              <Button
                disabled={stepIdx === 0}
                icon={<LeftOutlined />}
                onClick={() => manualStepIdxChange(Math.max(stepIdx - 1, 0))}
              >
                Previous
            </Button>
              {stepIdx !== steps.length - 1 ? (
                <Button
                  type='primary'
                  onClick={() => {
                    const newStepIdx = Math.min(stepIdx + 1, steps.length - 1);

                    manualStepIdxChange(newStepIdx);
                  }}
                  disabled={nextDisabledByPipeline}
                >
                  Next
                  <RightOutlined />
                </Button>
              )
                : (
                  <Link as={completedPath.replace('[experimentId]', experimentId)} href={completedPath} passHref>
                    <Button
                      type='primary'
                      onClick={() => {
                        completeStepAt(steps.length - 1);
                      }}
                      disabled={nextDisabledByPipeline}
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

  if (loading || cellSets.loading) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (loadingSettingsError) {
    return (
      <PlatformError
        error={loadingSettingsError}
        onClick={() => { dispatch(loadProcessingSettings(experimentId)); }}
      />
    );
  }

  if (cellSets.error) {
    return (
      <PlatformError
        error={cellSets.error}
        onClick={() => { dispatch(loadCellSets(experimentId)); }}
      />
    );
  }

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
          {steps.map(({ render, key }) => render(key, experimentId))}
        </Carousel>
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
