import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import {
  PageHeader, Select, Space, Button, Typography, Progress, Row, Col, Carousel, Card,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
} from '@ant-design/icons';

import Error from '../../../_error';
import getApiEndpoint from '../../../../utils/apiEndpoint';
import { getFromApiExpectOK } from '../../../../utils/cacheRequest';
import PreloadContent from '../../../../components/PreloadContent';
import FeedbackButton from '../../../../components/FeedbackButton';
import CellSizeDistribution from './filter-cells/components/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from './filter-cells/components/MitochondrialContent/MitochondrialContent';
import Classifier from './filter-cells/components/Classifier/Classifier';
import GenesVsUMIs from './filter-cells/components/GenesVsUMIs/GenesVsUMIs';
import DoubletScores from './filter-cells/components/DoubletScores/DoubletScores';
import DataIntegration from './data-integration/components/DataIntegration';
import EmbeddingPreview from './configure-embedding/components/EmbeddingPreview';
import { completeProcessingStep } from '../../../../redux/actions/experimentSettings';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = () => {
  const steps = [
    {
      key: 'cellSizeDistribution',
      name: 'Cell size distribution filter',
      render: (key) => <CellSizeDistribution filtering key={key} />,
    },
    {
      key: 'mitoContentFilter',
      name: 'Mitochondrial content filter',
      render: (key) => <MitochondrialContent filtering key={key} />,
    },
    {
      key: 'classifierFilter',
      name: 'Classifier filter',
      render: (key) => <Classifier filtering key={key} />,
    },
    {
      key: 'genesVsUMIFilter',
      name: 'Number of genes vs UMIs filter',
      render: (key) => <GenesVsUMIs filtering key={key} />,
    },
    {
      key: 'doubletFilter',
      name: 'Doublet filter',
      render: (key) => <DoubletScores filtering key={key} />,
    },
    {
      key: 'dataIntegration',
      name: 'Data integration',
      render: (key) => <DataIntegration filtering key={key} />,
    },
    {
      key: 'comptueEmbeddingFilter',
      name: 'Compute embedding',
      render: (key, expId) => <EmbeddingPreview experimentId={expId} key={key} />,
    },
  ];

  const router = useRouter();
  const dispatch = useDispatch();
  const { experimentId } = router.query;
  const { data, error } = useSWR(`${getApiEndpoint()}/v1/experiments/${experimentId}`, getFromApiExpectOK);
  const [stepId, setStepId] = useState(0);

  const completedSteps = useSelector((state) => state.experimentSettings.processing.meta.stepsDone);
  const carouselRef = useRef(null);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.goTo(stepId);
    }
  }, [stepId]);

  if (!data || !experimentId) {
    return <PreloadContent />;
  }

  if (error) {
    if (error.payload === undefined) {
      return <Error errorText='Cannot connect to API service.' />;
    }
    const { status } = error.payload;
    return <Error errorText={status} />;
  }

  const renderTitle = () => (
    <Row justify='space-between'>
      <Col span='8'>
        <Select
          value={stepId}
          onChange={(id) => {
            setStepId(id);
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
                  disabled={!completedSteps.has(key)}
                >
                  {name}
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
              disabled={stepId === 0}
              icon={<LeftOutlined />}
              onClick={() => setStepId(Math.max(stepId - 1, 0))}
            >
              Previous
            </Button>
            <Button
              type='primary'
              onClick={
                () => {
                  const newId = Math.min(stepId + 1, steps.length - 1);
                  setStepId(newId);

                  dispatch(completeProcessingStep(experimentId, steps[stepId].key, steps.length));
                }
              }
            >
              {stepId !== steps.length - 1
                ? (
                  <>
                    Next
                    <RightOutlined />
                  </>
                )
                : (
                  <>
                    <span style={{ marginRight: '0.25rem' }}>Finish</span>
                    <CheckOutlined />
                  </>
                )}
            </Button>
          </Space>
        </div>
      </Col>
    </Row>
  );

  return (
    <>
      <div style={{
        paddingLeft: 32, paddingRight: 32, display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}
      >
        <PageHeader
          title='Data processing'
          extra={(
            <FeedbackButton />
          )}
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
    </>
  );
};

export default DataProcessingPage;
