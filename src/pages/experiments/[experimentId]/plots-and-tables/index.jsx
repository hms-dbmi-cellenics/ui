/* eslint-disable import/no-duplicates */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Space, List, Card,
} from 'antd';
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
        height: '280px', width: '310px', align: 'center', padding: '10px',
      }}
    />
  </Card.Grid>
));

CardItem.defaultProps = {};

CardItem.propTypes = {
  item: PropTypes.object.isRequired,
  href: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

const PlotsTablesHome = ({ experimentId, experimentData }) => {
  const plots = [
    {
      name: 'Continuous Embedding',
      image: embeddingContinuous,
      key: 'embedding-continuous-key',
      link: 'embedding-continuous',
    },
    {
      name: 'Categorical Embedding',
      image: embeddingCategorical,
      key: 'embedding-categorical-key',
      link: 'embedding-categorical',
    },
    {
      name: 'Custom Heatmap',
      image: heatmap,
      key: 'heatmap-key',
      link: 'heatmap',
    },
    {
      name: 'Marker Heatmap',
      image: markerHeatmap,
      key: 'marker-heatmap-key',
      link: 'marker-heatmap',
    },
    {
      name: 'Volcano plot',
      image: volcano,
      key: 'volcano-key',
      link: 'volcano',
    },
    {
      name: 'Frequency Plot',
      image: frequency,
      key: 'frequency-key',
      link: 'frequency',
    },
    {
      name: 'Violin Plot',
      image: violin,
      key: 'violin-key',
      link: 'violin',
    },
    {
      name: 'Dot Plot',
      image: dotPlot,
      key: 'dot-key',
      link: 'dot-plot',
    },
    {
      name: 'Image Plot',
      image: dotPlot,
      key: 'img-plot-key',
      link: 'img-plot',
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

            <List.Item>
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
