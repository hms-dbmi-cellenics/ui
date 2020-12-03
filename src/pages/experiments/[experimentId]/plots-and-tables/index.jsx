/* eslint-disable import/no-duplicates */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  PageHeader, Row, Col, Space, Button, List, Card, Tooltip, Dropdown,
} from 'antd';
import { useSelector } from 'react-redux';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchMenu from '../../../../components/SearchMenu';
import heatmap from '../../../../../static/media/heatmap.png';
import embeddingContinuous from '../../../../../static/media/embeddingContinuous.png';
import embeddingCategorical from '../../../../../static/media/embeddingCategorical.png';
import volcano from '../../../../../static/media/volcano.png';
import frequency from '../../../../../static/media/volcano.png';
import FeedbackButton from '../../../../components/FeedbackButton';

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
        height: '250px', width: '100%', align: 'center', padding: '8px',
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

const PlotsTablesHome = () => {
  let lastUpdatedVolcano = useSelector((state) => state.plots.volcanoPlotMain?.lastUpdated);
  let lastUpdatedContinuous = useSelector((state) => state.plots.embeddingContinuousMain?.lastUpdated);
  let lastUpdatedCategorical = useSelector((state) => state.plots.embeddingCategoricalMain?.lastUpdated);
  let lastUpdatedHeatmap = useSelector((state) => state.plots.lastUpdatedHeatmap?.lastUpdated);

  if (!lastUpdatedVolcano) {
    lastUpdatedVolcano = 'never';
  }
  if (!lastUpdatedContinuous) {
    lastUpdatedContinuous = 'never';
  }
  if (!lastUpdatedCategorical) {
    lastUpdatedCategorical = 'never';
  }
  if (!lastUpdatedHeatmap) {
    lastUpdatedHeatmap = 'never';
  }
  const router = useRouter();
  const { experimentId } = router.query;
  const plots = [
    {
      name: 'Continuous Embedding',
      image: embeddingContinuous,
      key: 'embedding-continuous-key',
      link: 'embedding-continuous',
      description: `Last updated: ${lastUpdatedContinuous}`,
    },
    {
      name: 'Categorical Embedding',
      image: embeddingCategorical,
      key: 'embedding-categorical-key',
      link: 'embedding-categorical',
      description: `Last updated: ${lastUpdatedCategorical}`,
    },
    {
      name: 'Heatmap',
      image: heatmap,
      key: 'heatmap-key',
      link: 'heatmap',
      description: `Last updated: ${lastUpdatedHeatmap}`,
    },
    {
      name: 'Volcano plot',
      image: volcano,
      key: 'volcano-key',
      link: 'volcano',
      description: `Last updated: ${lastUpdatedVolcano}`,
    },
    {
      name: 'FrequencyPlot',
      image: frequency,
      key: 'frequency-key',
      link: 'frequency',
      description: `Last updated: ${lastUpdatedVolcano}`,
    },
  ];

  const [openedPlots, setOpenedPlots] = useState(plots);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const openPlot = (key) => {
    if (openedPlots.find((obj) => obj.key === key)) {
      return;
    }
    const plotToRender = plots.find((obj) => obj.key === key);
    openedPlots.unshift(plotToRender);
    setOpenedPlots(openedPlots);
  };

  const renderExtras = (item) => (
    <Space>
      <Button
        icon={<CloseOutlined />}
        type='text'
        size='small'
        onClick={(event) => {
          const newOpenedPlots = openedPlots.filter((obj) => obj.key !== item.key);
          setOpenedPlots(newOpenedPlots);
          event.stopPropagation();
        }}
      />
    </Space>
  );

  const searchMenu = (
    <SearchMenu
      options={{ Plots: plots }}
      onSelect={(key) => {
        openPlot(key);
        setAddMenuVisible(false);
      }}
    />
  );

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Row gutter={16}>
        <Col span={18}>
          <PageHeader
            title='Plots and Tables'
            subTitle='Home'
            style={{ width: '100%', paddingRight: '0px' }}
            extra={(
              <Space>
                <FeedbackButton />
                <Dropdown
                  trigger={['click']}
                  overlay={searchMenu}
                  visible={addMenuVisible}
                  onVisibleChange={(visible) => setAddMenuVisible(visible)}
                >
                  <Button
                    type='primary'
                    onClick={() => setAddMenuVisible(!addMenuVisible)}
                  >
                    Open Existing
                    {' '}
                    <DownOutlined />
                  </Button>
                </Dropdown>
                <Tooltip title='Coming soon!'>
                  <Button type='primary' disabled>
                    Create
                  </Button>
                </Tooltip>
              </Space>
            )}
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
                    extra={renderExtras(item)}
                    bodyStyle={{ padding: '0' }}
                  >
                    <Link as={`/experiments/${experimentId}/plots-and-tables/${item.link}`} href={`/experiments/[experimentId]/plots-and-tables/${item.link}`} passHref>
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
};
export default PlotsTablesHome;
