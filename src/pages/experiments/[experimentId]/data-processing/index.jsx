import React, { useState } from 'react';
import {
  PageHeader, Collapse, Switch, Tooltip, Select,
  Steps, Space, Button, Typography, Progress, Descriptions, Statistic,
  Row, Col,
} from 'antd';

import {
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import Error from 'next/error';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import FeedbackButton from '../../../../components/FeedbackButton';
import getApiEndpoint from '../../../../utils/apiEndpoint';
import { getFromApiExpectOK } from '../../../../utils/cacheRequest';
import PreloadContent from '../../../../components/PreloadContent';

import CellSizeDistribution from './filter-cells/components/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from './filter-cells/components/MitochondrialContent/MitochondrialContent';
import Classifier from './filter-cells/components/Classifier/Classifier';
import GenesVsUMIs from './filter-cells/components/GenesVsUMIs/GenesVsUMIs';
import DoubletScores from './filter-cells/components/DoubletScores/DoubletScores';
import ReduceDimensions from './reduce-dimensions/components/DimensionalityReduction/DimensionalityReduction';
import EmbeddingPreview from './configure-embedding/components/EmbeddingPreview';

const { Text } = Typography;
const { Option } = Select;

const DataProcessingPage = () => {
  const router = useRouter();
  const { experimentId } = router.query;

  const steps = [
    {
      name: 'Cell size distribution filter',
      render: () => <CellSizeDistribution />,
    },
    {
      name: 'Mitochondrial content filter',
      render: () => <MitochondrialContent />,
    },
    {
      name: 'Classifier filter',
      render: () => <Classifier />,
    },
    {
      name: 'Number of genes vs UMIs filter',
      render: () => <GenesVsUMIs />,
    },
    {
      name: 'Doublet filter',
      render: () => <DoubletScores />,
    },
    {
      name: 'Dimensionality reduction',
      render: () => <ReduceDimensions />,
    },
    {
      name: 'Compute embedding',
      render: () => <EmbeddingPreview experimentId={experimentId} />,
    },
  ];

  const [stepId, setStepId] = useState(0);

  const { data, error } = useSWR(`${getApiEndpoint()}/v1/experiments/${experimentId}`, getFromApiExpectOK);

  if (error) {
    if (error.payload === undefined) {
      return <Error statusCode='You are not connected to the backend.' />;
    }
    const { status } = error.payload;
    return <Error statusCode={status} />;
  }

  if (!data) {
    return <PreloadContent />;
  }

  return (
    <>
      <div style={{
        paddingLeft: 32, paddingRight: 32,
      }}
      >
        <PageHeader
          title='Data processing'
          extra={(
            <FeedbackButton />
          )}
        />
      </div>
      <div
        style={{
          backgroundColor: '#ffffff', paddingLeft: 32, paddingRight: 32, paddingTop: 16, paddingBottom: 16,
        }}
      >
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <Row justify='space-between'>
            <Col span='8'>
              <Select value={stepId} onChange={(id) => setStepId(id)} style={{ width: 360, fontWeight: 'bold' }} placeholder='Jump to a step...'>
                {steps.map(({ name }, i) => (<Option value={i}>{name}</Option>))}
              </Select>
            </Col>
            <Col span='16'>
              <div style={{ float: 'right' }}>
                <Space size='large'>
                  <Progress
                    percent={((stepId + 1) / steps.length) * 100}
                    steps={steps.length}
                    showInfo={false}
                  />
                  <Text type='primary'>{`${stepId + 1} of ${steps.length} steps`}</Text>
                  <Button
                    disabled={stepId === 0}
                    icon={<LeftOutlined />}
                    onClick={() => setStepId(Math.max(stepId - 1, 0))}
                  >
                    Previous
                  </Button>
                  <Button type='primary' onClick={() => setStepId(Math.min(stepId + 1, steps.length - 1))}>
                    Next
                    <RightOutlined />
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
          {steps[stepId].render()}

        </Space>
      </div>
    </>
  );
};

export default DataProcessingPage;
