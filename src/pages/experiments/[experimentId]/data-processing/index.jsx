import React, { useState, useEffect, useRef } from 'react';
import {
  PageHeader, Select, Space, Button, Typography, Progress, Row, Col, Carousel, Card,
} from 'antd';

import {
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Error from '../../../_error';
import FeedbackButton from '../../../../components/FeedbackButton';
import getApiEndpoint from '../../../../utils/apiEndpoint';
import { getFromApiExpectOK } from '../../../../utils/cacheRequest';
import PreloadContent from '../../../../components/PreloadContent';

import CellSizeDistribution from './filter-cells/components/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from './filter-cells/components/MitochondrialContent/MitochondrialContent';
import Classifier from './filter-cells/components/Classifier/Classifier';
import GenesVsUMIs from './filter-cells/components/GenesVsUMIs/GenesVsUMIs';
import DoubletScores from './filter-cells/components/DoubletScores/DoubletScores';
import DataIntegration from './data-integration/components/DataIntegration';
import EmbeddingPreview from './configure-embedding/components/EmbeddingPreview';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = () => {
  const router = useRouter();
  const { experimentId } = router.query;

  const steps = [
    {
      id: 'cellSizeDistribution',
      name: 'Cell size distribution filter',
      render: () => <CellSizeDistribution filtering />,
    },
    {
      id: 'mitoContentFilter',
      name: 'Mitochondrial content filter',
      render: () => <MitochondrialContent filtering />,
    },
    {
      id: 'classifierFilter',
      name: 'Classifier filter',
      render: () => <Classifier filtering />,
    },
    {
      id: 'genesVsUMIFilter',
      name: 'Number of genes vs UMIs filter',
      render: () => <GenesVsUMIs filtering />,
    },
    {
      id: 'doubletFilter',
      name: 'Doublet filter',
      render: () => <DoubletScores filtering />,
    },
    {
      id: 'dataIntegration',
      name: 'Data integration',
      render: () => <DataIntegration filtering />,
    },
    {
      id: 'comptueEmbeddingFilter',
      name: 'Compute embedding',
      render: (expId) => <EmbeddingPreview experimentId={expId} />,
    },
  ];

  const { data, error } = useSWR(`${getApiEndpoint()}/v1/experiments/${experimentId}`, getFromApiExpectOK);

  const [stepId, setStepId] = useState(5);

  const [completedSteps, setCompletedSteps] = useState(new Set());

  const carouselRef = useRef(null);

  useEffect(() => {
    setCompletedSteps(new Set([...completedSteps]).add(steps[stepId].id));

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
          onChange={(id) => setStepId(id)}
          style={{ width: 360, fontWeight: 'bold' }}
          placeholder='Jump to a step...'
        >
          {
            steps.map(
              ({ name, id }, i) => (
                <Option
                  value={i}
                  disabled={!completedSteps.has(id)}
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
                }
              }
            >
              Next
              <RightOutlined />
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
            {steps.map((step) => step.render(experimentId))}
          </Carousel>
        </Card>
      </div>
    </>
  );
};

export default DataProcessingPage;
