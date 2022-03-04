import React from 'react';
import {
  Row, Col, Skeleton,
} from 'antd';

const PreloadContent = () => (
  <>
    <div data-testid='preloadContent' style={{ padding: '20px 0' }}>
      <Row gutter={32}>
        <Col className='gutter-row' span={14} offset={2}>
          <div className='preloadContextSkeleton' style={{ padding: '16px 0px' }}>
            <Skeleton.Input style={{ width: '100%', height: 400 }} active />
          </div>
          <div className='preloadContextSkeleton' style={{ padding: '16px 0px' }}>
            <Skeleton.Input style={{ width: '100%', height: 400 }} active />
          </div>
          <div className='preloadContextSkeleton' style={{ padding: '16px 0px' }}>
            <Skeleton.Input style={{ width: '100%', height: 400 }} active />
          </div>
        </Col>
        <Col className='gutter-row' span={6}>
          <Skeleton active paragraph={{ rows: 10 }} />
          <Skeleton active paragraph={{ rows: 10 }} />
          <Skeleton active paragraph={{ rows: 10 }} />
        </Col>
      </Row>
    </div>
  </>
);

export default PreloadContent;
