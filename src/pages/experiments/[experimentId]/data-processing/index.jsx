import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Link from 'next/link';
import {
  Select, Space, Button, Typography, Row, Col, Carousel, Card,
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
import StepsIndicator from './StepsIndicator';
import SingleComponentMultipleDataContainer from '../../../../components/SingleComponentMultipleDataContainer';
import { completeProcessingStep, loadProcessingSettings } from '../../../../redux/actions/experimentSettings';
import loadCellSets from '../../../../redux/actions/cellSets/loadCellSets';

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

  const pipelineBlockingSteps = pipelineStatusKey === 'RUNNING' || pipelineErrors.includes(pipelineStatusKey);

  const pipelineRunningCompletedSteps = pipelineStatus.pipeline?.completedSteps;

  const cellSets = useSelector((state) => state.cellSets);

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

  const stepIsCompletedInPipeline = (stepName) => {
    const lowerCaseStepName = stepName.toLowerCase();

    const stepAppearances = _.filter(pipelineRunningCompletedSteps, (stepPipelineName) => {
      return stepPipelineName.toLowerCase().includes(lowerCaseStepName);
    });

    return stepAppearances.length > 0;
  }

  const inputsList = sampleKeys?.map((key) => ({ key, headerName: `Sample ${cellSets.properties?.[key].name}`, params: { ...cellSets.properties?.[key], key } }));

  const steps = [
    {
      key: 'cellSizeDistribution',
      name: 'Cell size distribution filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'mitochondrialContent',
      name: 'Mitochondrial content filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'classifier',
      name: 'Classifier filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'numGenesVsNumUmis',
      name: 'Number of genes vs UMIs filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'doubletScores',
      name: 'Doublet filter',
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
            />
          )}
        />
      ),
    },
    {
      key: 'dataIntegration',
      name: 'Data integration',
      render: (key) => <DataIntegration key={key} />,
    },
    {
      key: 'computeEmbedding',
      name: 'Compute embedding',
      render: (key, expId) => <ConfigureEmbedding experimentId={expId} key={key} />,
    },
  ];

  const [stepIdx, setStepIdx] = useState(completedSteps.size % steps.length);

  const carouselRef = useRef(null);

  useEffect(() => {
    setStepIdx(completedSteps.size % steps.length);
  }, [loading]);

  useEffect(() => {
    const completeProcessingStepIfAdvanced = () => {
      if (stepIdx > completedSteps.size) {
        dispatch(completeProcessingStep(experimentId, steps[stepIdx - 1].key, steps.length));
      }
    };

    if (carouselRef.current) {
      carouselRef.current.goTo(stepIdx, true);
      completeProcessingStepIfAdvanced();
    }
  }, [stepIdx, carouselRef.current]);



  useEffect(() => {
    if (completingStepError && stepIdx > completedSteps.size) {
      setStepIdx(completedSteps.size);
      return;
    }


  }, [completingStepError, stepIdx,]);

  let nextDisabledByPipeline = false;

  if (steps[stepIdx + 1]) {
    const { key: nextKey } = steps[stepIdx + 1];
    nextDisabledByPipeline = pipelineBlockingSteps && !stepIsCompletedInPipeline(nextKey);
  }

  const renderTitle = () => (
    <Row justify='space-between'>
      <Col span='8'>
        <Select
          value={stepIdx}
          onChange={(idx) => {
            setStepIdx(idx);
          }}
          style={{ width: 360, fontWeight: 'bold' }}
          placeholder='Jump to a step...'
        >
          {
            steps.map(
              ({ name, key }, i) => {
                const disabledByPipeline = pipelineBlockingSteps && !stepIsCompletedInPipeline(key);

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
      </Col>
      <Col span='16'>
        <div style={{ float: 'right' }}>
          <Space size='large'>
            <StepsIndicator
              allSteps={steps}
              currentStep={stepIdx}
              completedSteps={completedSteps.size}
            />
            <Text type='primary'>{`${completedSteps.size} of ${steps.length} steps complete`}</Text>
            <Button
              disabled={stepIdx === 0}
              icon={<LeftOutlined />}
              onClick={() => setStepIdx(Math.max(stepIdx - 1, 0))}
            >
              Previous
            </Button>
            {stepIdx !== steps.length - 1 ? (
              <Button
                type='primary'
                onClick={
                  () => {
                    const newId = Math.min(stepIdx + 1, steps.length - 1);
                    setStepIdx(newId);
                  }
                }
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
                    onClick={
                      () => {
                        dispatch(
                          completeProcessingStep(experimentId, steps[stepIdx].key, steps.length),
                        );
                      }
                    }
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
    </Row>
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
