import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Link from 'next/link';
import {
  Select, Space, Button, Typography, Progress, Row, Col, Carousel, Card,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  CaretRightOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';

import Header from '../../../../components/Header';

import CellSizeDistribution from '../../../../components/data-processing/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from '../../../../components/data-processing/MitochondrialContent/MitochondrialContent';
import Classifier from '../../../../components/data-processing/Classifier/Classifier';
import GenesVsUMIs from '../../../../components/data-processing/GenesVsUMIs/GenesVsUMIs';
import DoubletScores from '../../../../components/data-processing/DoubletScores/DoubletScores';
import DataIntegration from '../../../../components/data-processing/DataIntegration/DataIntegration';
import ConfigureEmbedding from '../../../../components/data-processing/ConfigureEmbedding/ConfigureEmbedding';
import { completeProcessingStep, loadProcessingSettings } from '../../../../redux/actions/experimentSettings';

import SingleComponentMultipleDataContainer from '../../../../components/SingleComponentMultipleDataContainer';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = ({ experimentId, experimentData, route }) => {
  const cellSetsProperties = useSelector((state) => state.cellSets.properties);
  const cellSetsHierarchy = useSelector((state) => state.cellSets.hierarchy);

  const sampleKeys = cellSetsHierarchy.find(
    (rootNode) => (rootNode.key === 'sample'),
  ).children.map(
    (child) => child.key,
  );

  const inputsList = sampleKeys.map((key) => ({ key, headerName: `Sample ${cellSetsProperties[key].name}`, params: { ...cellSetsProperties[key], key } }));

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
      key: 'mitoContentFilter',
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
      key: 'classifierFilter',
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
      key: 'genesVsUMIFilter',
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
      key: 'doubletFilter',
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
      key: 'comptueEmbeddingFilter',
      name: 'Compute embedding',
      render: (key, expId) => <ConfigureEmbedding experimentId={expId} key={key} />,
    },
  ];

  const dispatch = useDispatch();

  const completedPath = '/experiments/[experimentId]/data-exploration';

  const {
    loading,
    stepsDone: completedSteps,
    loadingSettingsError,
    completingStepError,
  } = useSelector((state) => state.experimentSettings.processing.meta);

  const [stepIdx, setStepIdx] = useState(completedSteps.size % steps.length);

  const carouselRef = useRef(null);

  useEffect(() => {
    if (loading && !loadingSettingsError) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    setStepIdx(completedSteps.size % steps.length);
  }, [loading]);

  useEffect(() => {
    const goToStepIdx = () => {
      if (carouselRef.current) {
        carouselRef.current.goTo(stepIdx, true);
      }
    };

    const completeProcessingStepIfAdvanced = () => {
      if (stepIdx > completedSteps.size) {
        dispatch(completeProcessingStep(experimentId, steps[stepIdx - 1].key, steps.length));
      }
    };

    goToStepIdx();
    completeProcessingStepIfAdvanced();
  }, [stepIdx]);

  useEffect(() => {
    if (!completingStepError) {
      return;
    }

    if (stepIdx > completedSteps.size) {
      setStepIdx(completedSteps.size);
    }
  }, [completingStepError, stepIdx]);

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
              ({ name, key }, i) => (
                <Option
                  value={i}
                  key={key}
                  disabled={
                    !completedSteps.has(key)
                    && i !== completedSteps.size
                    && i !== stepIdx + 1
                  }
                >

                  {completedSteps.has(key) && (
                    <>
                      <Text
                        type='success'
                      >
                        <CheckOutlined />
                      </Text>
                      <span style={{ marginLeft: '0.25rem' }}>{name}</span>
                    </>
                  )}

                  {!completedSteps.has(key) && completedSteps.size === i && (
                    <Text
                      type='default'
                    >
                      <CaretRightOutlined />
                      <span style={{ marginLeft: '0.25rem' }}>{name}</span>
                    </Text>
                  )}

                  {!completedSteps.has(key) && completedSteps.size < i && (
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
              ),
            )
          }
        </Select>
      </Col>
      <Col span='16'>
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
