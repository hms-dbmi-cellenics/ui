/* eslint-disable import/no-duplicates */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Row, Col, Space, Button, List, Card, Tooltip, Dropdown,
} from 'antd';
import { useSelector } from 'react-redux';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import SearchMenu from 'components/SearchMenu';
import Header from 'components/Header';

import heatmap from '../../../../../public/static/media/heatmap.png';
import embeddingContinuous from '../../../../../public/static/media/embeddingContinuous.png';
import embeddingCategorical from '../../../../../public/static/media/embeddingCategorical.png';
import violin from '../../../../../public/static/media/violin.png';
import dotPlot from '../../../../../public/static/media/dotplot.png';
import volcano from '../../../../../public/static/media/volcano.png';
import frequency from '../../../../../public/static/media/frequency.png';
import markerHeatmap from '../../../../../public/static/media/marker_heatmap.png';

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

const PlotsTablesHome = ({ experimentId, experimentData, route }) => {
  const lastUpdatedVolcano = useSelector(
    (state) => state.componentConfig.volcanoPlotMain?.lastUpdated || 'never',
  );
  const lastUpdatedContinuous = useSelector(
    (state) => state.componentConfig.embeddingContinuousMain?.lastUpdated || 'never',
  );
  const lastUpdatedCategorical = useSelector(
    (state) => state.componentConfig.embeddingCategoricalMain?.lastUpdated || 'never',
  );
  const lastUpdatedHeatmap = useSelector(
    (state) => state.componentConfig.heatmapPlotMain?.lastUpdated || 'never',
  );
  const lastUpdatedFrequency = useSelector(
    (state) => state.componentConfig.frequencyPlotMain?.lastUpdated || 'never',
  );
  const lastUpdatedViolin = useSelector(
    (state) => state.componentConfig.violinPlotMain?.lastUpdated || 'never',
  );
  const lastUpdatedMarkerHeatmap = useSelector(
    (state) => state.componentConfig.markerHeatmapPlotMain?.lastUpdated || 'never',
  );
  const lastUpdatedDotPlot = useSelector(
    (state) => state.componentConfig.dotPlotMain?.lastUpdated || 'never',
  );

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
      name: 'Custom Heatmap',
      image: heatmap,
      key: 'heatmap-key',
      link: 'heatmap',
      description: `Last updated: ${lastUpdatedHeatmap}`,
    },
    {
      name: 'Marker Heatmap',
      image: markerHeatmap,
      key: 'marker-heatmap-key',
      link: 'marker-heatmap',
      description: `Last updated: ${lastUpdatedMarkerHeatmap}`,
    },
    {
      name: 'Volcano plot',
      image: volcano,
      key: 'volcano-key',
      link: 'volcano',
      description: `Last updated: ${lastUpdatedVolcano}`,
    },
    {
      name: 'Frequency Plot',
      image: frequency,
      key: 'frequency-key',
      link: 'frequency',
      description: `Last updated: ${lastUpdatedFrequency}`,
    },
    {
      name: 'Violin Plot',
      image: violin,
      key: 'violin-key',
      link: 'violin',
      description: `Last updated: ${lastUpdatedViolin}`,
    },
    {
      name: 'Dot Plot',
      image: dotPlot,
      key: 'dot-key',
      link: 'dot-plot',
      description: `Last updated: ${lastUpdatedDotPlot}`,
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
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        route={route}
        title='Plots and Tables'
        extra={[(
          <Dropdown
            trigger={['click']}
            key='search-menu-dropdown'
            overlay={searchMenu}
            visible={addMenuVisible}
            onVisibleChange={(visible) => setAddMenuVisible(visible)}
          >
            <Button type='primary' onClick={() => setAddMenuVisible(!addMenuVisible)}>
              Add
              {' '}
              <DownOutlined />
            </Button>
          </Dropdown>
        )]}
      />
      <Space direction='vertical' style={{ width: '100%', padding: '10px' }}>
        <List
          grid={{ gutter: 16 }}
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
                <Link
                  as={`/experiments/${experimentId}/plots-and-tables/${item.link}`}
                  href={`/experiments/[experimentId]/plots-and-tables/${item.link}`}
                  passHref
                >
                  <CardItem item={item} />
                </Link>
              </Card>
            </List.Item>
          )}
        />
      </Space>

    </>
  );
};

PlotsTablesHome.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  route: PropTypes.string.isRequired,
};

export default PlotsTablesHome;
