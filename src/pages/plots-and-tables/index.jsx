import React from 'react';

import {
  PageHeader, Row, Col, Space, Button, List, Card,
} from 'antd';

import Link from 'next/link';
import SearchMenu from '../../components/search-menu/SearchMenu';
import heatmapPic from '../../../static/media/heatmap.png';
import embeddingCont from '../../../static/media/embeddingContinuous.png';
import embeddingCat from '../../../static/media/embeddingCategorical.png';
import volcano from '../../../static/media/volcano.png';

class PlotsTablesHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const data = [
      {
        name: 'Embedding with cluster labels',
        image: embeddingCont,
        key: 'embedding-cont-key',
        link: '/plots-and-tables/embedding-continuous',
        text: 'Last modified: 2nd June 20:20',
      },
      {
        name: 'Embedding with gene expression',
        image: embeddingCat,
        key: 'embedding-cat-key',
        link: '/plots-and-tables/embedding-categorical',
        text: 'Last modified: 2nd June 20:20',
      },
      {
        name: 'Heatmap',
        image: heatmapPic,
        key: 'heatmap-key',
        link: '/plots-and-tables/heatmap',
        text: 'Last modified: 2nd June 20:20',
      },
      {
        name: 'Volcano plot',
        image: volcano,
        key: 'volcano-key',
        link: '/plots-and-tables/volcano',
        text: 'Last modified: 2nd June 20:20',
      },
    ];
    return (
      <>
        <Row gutter={16}>
          <Col span={18}>
            <PageHeader
              className='site-page-header'
              title='Plots and Tables'
              subTitle='Home'
              extra={(
                <Button type='primary'>
                  Create
                </Button>
              )}
            />
            <Space direction='vertical' style={{ width: '100%' }}>
              <SearchMenu
                options={[]}
                onSelect={() => { }}
                placeholder='Search in existing figures ...'
              />
              <h1>Recent</h1>
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={data}
                renderItem={(item) => (
                  <List.Item style={{ width: '100%' }}>
                    <Link href={item.link} passHref>
                      <Card
                        hoverable
                        cover={<img alt='example' src={item.image} style={{ height: '300px', padding: '10px' }} />}
                      >
                        <Card.Meta title={item.name} />
                        {item.text}
                      </Card>
                    </Link>
                  </List.Item>
                )}
              />
            </Space>
          </Col>
          <Col span={7} />
        </Row>
      </>
    );
  }
}

export default PlotsTablesHome;
