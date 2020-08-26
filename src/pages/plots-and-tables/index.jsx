import React from 'react';
import PropTypes from 'prop-types';
import {
  PageHeader, Row, Col, Space, Button, List, Card, Tooltip, Dropdown,
} from 'antd';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import SearchMenu from '../../components/SearchMenu';
import heatmapPic from '../../../static/media/heatmap.png';
import embeddingCont from '../../../static/media/embeddingC.png';
import embeddingCat from '../../../static/media/embeddingG.png';
import volcano from '../../../static/media/volcano.png';

const CardItem = React.forwardRef(({ onClick, item, href }, ref) => (
  <Card.Grid
    href={href}
    ref={ref}
    onClick={onClick}
    hoverable={false}
    style={{ textAlign: 'center', width: '100%', padding: '0' }}
  >
    <img
      alt={item.name}
      src={item.image}
      style={{
        height: '250px', width: '300px', align: 'center', padding: '8px',
      }}
    />
    <div style={{ paddingBottom: '8px' }}>
      {item.description}
    </div>
  </Card.Grid>
));


CardItem.defaultProps = {};

CardItem.propTypes = {
  item: PropTypes.object.isRequired,
  href: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
class PlotsTablesHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.plots = [
      {
        name: 'Embedding with cluster labels',
        image: embeddingCont,
        key: 'embedding-cont-key',
        link: '/plots-and-tables/embedding-categorical',
        description: 'Last modified: 2nd June 20:20',
      },
      {
        name: 'Embedding with gene expression',
        image: embeddingCat,
        key: 'embedding-cat-key',
        link: '/plots-and-tables/embedding-continuous',
        description: 'Last modified: 2nd June 20:20',
      },
      {
        name: 'Heatmap',
        image: heatmapPic,
        key: 'heatmap-key',
        link: '/plots-and-tables/heatmap',
        description: 'Last modified: 2nd June 20:20',
      },
      {
        name: 'Volcano plot',
        image: volcano,
        key: 'volcano-key',
        link: '/plots-and-tables/volcano',
        description: 'Last modified: 2nd June 20:20',
      },
    ];

    this.state = {
      openedPlots: this.plots,
      addMenuVisible: false,
    };
  }

  openPlot(key) {
    const { openedPlots } = this.state;

    if (openedPlots.find((obj) => obj.key === key)) {
      return;
    }

    const plotToRender = this.plots.find((obj) => obj.key === key);
    openedPlots.unshift(plotToRender);
    this.setState({ openedPlots });
  }

  renderExtras(item) {
    const { openedPlots } = this.state;

    return (
      <Space>
        <Button
          icon={<CloseOutlined />}
          type='text'
          size='small'
          onClick={(event) => {
            const newOpenedPlots = openedPlots.filter((obj) => obj.key !== item.key);
            this.setState({ openedPlots: newOpenedPlots });
            event.stopPropagation();
          }}
        />
      </Space>
    );
  }

  render() {
    const { openedPlots, addMenuVisible } = this.state;
    const searchMenu = (
      <SearchMenu
        options={{ Plots: this.plots }}
        onSelect={(key) => {
          this.openPlot(key);
          this.setState({ addMenuVisible: false });
        }}
      />
    );

    return (
      <div style={{ paddingLeft: 32, paddingRight: 32 }}>
        <Row gutter={16}>
          <Col span={18}>
            <PageHeader
              className='site-page-header'
              title='Plots and Tables'
              subTitle='Home'
              style={{ width: '100%', paddingRight: '0px' }}
              extra={[
                <Dropdown
                  overlay={searchMenu}
                  visible={addMenuVisible}
                  onVisibleChange={(visible) => this.setState({ addMenuVisible: visible })}
                >
                  <Button
                    type='primary'
                    onClick={() => this.setState({ addMenuVisible: !addMenuVisible })}
                  >
                    Open Existing
                    {' '}
                    <DownOutlined />
                  </Button>
                </Dropdown>,
                <Tooltip title='Coming soon!'>
                  <Button type='primary' disabled>
                    Create
                  </Button>
                </Tooltip>,
              ]}
            />
            <Space direction='vertical' style={{ width: '100%' }}>
              <h1>Recent</h1>
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={openedPlots}
                renderItem={(item) => (
                  <List.Item>
                    <Card
                      size='small'
                      hoverable
                      title={item.name}
                      extra={this.renderExtras(item)}
                      bodyStyle={{ padding: '0' }}
                    >
                      <Link href={item.link} passHref>
                        <CardItem item={item} />
                      </Link>
                    </Card>
                  </List.Item>
                )}
              />
            </Space>
          </Col>
          <Col span={7} />
        </Row>
      </div>
    );
  }
}

export default PlotsTablesHome;
