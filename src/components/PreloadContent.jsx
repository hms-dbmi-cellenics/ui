import React from 'react';
import {
  Row, Col, Skeleton, PageHeader,
} from 'antd';

const PreloadContent = () => (
  <>
    <div style={{ padding: '20px 0' }} />
    <Row gutter={16}>
      <Col className='gutter-row' span={2}>
        <div style={{ padding: '8px 0' }} />
      </Col>
      <Col className='gutter-row' span={15}>
        <Skeleton active />
      </Col>
      <Col className='gutter-row' span={6}>
        <Skeleton active />
      </Col>
      <Col className='gutter-row' span={2}>
        <div style={{ padding: '8px 0' }} />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col className='gutter-row' span={2}>
        <div style={{ padding: '8px 0' }} />
      </Col>
      <Col className='gutter-row' span={15}>
        <Skeleton active />
      </Col>
      <Col className='gutter-row' span={6}>
        <Skeleton active />
      </Col>
      <Col className='gutter-row' span={2}>
        <div style={{ padding: '8px 0' }} />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col className='gutter-row' span={2}>
        <div style={{ padding: '8px 0' }} />
      </Col>
      <Col className='gutter-row' span={15}>
        <div style={{ padding: '8px 0' }} />
      </Col>
      <Col className='gutter-row' span={6}>
        <Skeleton active />
      </Col>
      <Col className='gutter-row' span={2}>
        <div style={{ padding: '8px 0' }} />
      </Col>
    </Row>
  </>
);


export default PreloadContent;
