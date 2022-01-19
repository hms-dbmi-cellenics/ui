/* eslint-disable import/no-duplicates */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Space, List, Card,
} from 'antd';
import { useSelector } from 'react-redux';
import Link from 'next/link';
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

const PlotsTablesHome = ({ experimentId, experimentData }) => {
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

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Plots and Tables'
      />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>
        <List
          grid={{ gutter: 16 }}
          dataSource={plots}
          renderItem={(item) => (

            <List.Item style={{ width: '320px', height: '320px' }}>
              <Card
                size='small'
                hoverable
                title={item.name}
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
};

export default PlotsTablesHome;
