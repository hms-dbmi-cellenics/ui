/* eslint-disable import/no-duplicates */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Space, Divider, Card, Row, Col,
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

const CardItem = (({ onClick, item, href }) => (
  <Card.Grid
    href={href}
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
  const ROW_STYLE = { margin: '0.5em' };
  const GUTTER_STYLE = {
    xs: 4, sm: 8, md: 12, lg: 16,
  };
  const CARD_STYLE = { marginBottom: '1em' };

  const plots = {
    cellsets: {
      title: 'Cell sets & metadata',
      plots: [
        {
          name: 'Categorical Embedding',
          image: embeddingCategorical,
          key: 'embedding-categorical-key',
          link: 'embedding-categorical',
        },
        {
          name: 'Frequency Plot',
          image: frequency,
          key: 'frequency-key',
          link: 'frequency',
        },
      ],
    },
    'gene-expression': {
      title: 'Gene expression',
      plots: [
        {
          name: 'Continuous Embedding',
          image: embeddingContinuous,
          key: 'embedding-continuous-key',
          link: 'embedding-continuous',
        },
        {
          name: 'Marker Heatmap',
          image: markerHeatmap,
          key: 'marker-heatmap-key',
          link: 'marker-heatmap',
        },
        {
          name: 'Custom Heatmap',
          image: heatmap,
          key: 'heatmap-key',
          link: 'heatmap',
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
      ],
    },
    'differential-expression': {
      title: 'Differential expression',
      plots: [
        {
          name: 'Volcano plot',
          image: volcano,
          key: 'volcano-key',
          link: 'volcano',
        },
      ],
    },

  };

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Plots and Tables'
      />
      <Space style={{ padding: '1em' }} direction='vertical'>
        <Row
          gutter={GUTTER_STYLE}
          style={ROW_STYLE}
        >
          <Col span={24}>
            <Divider
              orientation='left'
              orientationMargin='0'
            >
              <strong>{plots.cellsets.title}</strong>
            </Divider>
          </Col>
          {plots.cellsets.plots.map((item) => (
            <Col span={6}>
              <Card
                size='small'
                hoverable
                title={item.name}
                bodyStyle={{ padding: '0' }}
                style={CARD_STYLE}
              >
                <Link
                  as={`/experiments/${experimentId}/plots-and-tables/${item.link}`}
                  href={`/experiments/[experimentId]/plots-and-tables/${item.link}`}
                  passHref
                >
                  <CardItem item={item} />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>

        <Row
          gutter={GUTTER_STYLE}
          style={ROW_STYLE}
        >
          <Col span={24}>
            <Divider orientation='left'><strong>{plots['gene-expression'].title}</strong></Divider>
          </Col>
          {plots['gene-expression'].plots.map((item) => (
            <Col span={6}>
              <Card
                size='small'
                hoverable
                title={item.name}
                bodyStyle={{ padding: '0' }}
                style={CARD_STYLE}
              >
                <Link
                  as={`/experiments/${experimentId}/plots-and-tables/${item.link}`}
                  href={`/experiments/[experimentId]/plots-and-tables/${item.link}`}
                  passHref
                >
                  <CardItem item={item} />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>

        <Row
          gutter={GUTTER_STYLE}
          style={ROW_STYLE}
        >
          <Col span={24}>
            <Divider orientation='left'><strong>{plots['differential-expression'].title}</strong></Divider>
          </Col>
          {plots['differential-expression'].plots.map((item) => (
            <Col span={6}>
              <Card
                size='small'
                hoverable
                title={item.name}
                bodyStyle={{ padding: '0' }}
                style={CARD_STYLE}
              >
                <Link
                  as={`/experiments/${experimentId}/plots-and-tables/${item.link}`}
                  href={`/experiments/[experimentId]/plots-and-tables/${item.link}`}
                  passHref
                >
                  <CardItem item={item} />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
    </>
  );
};

PlotsTablesHome.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default PlotsTablesHome;
