import React from 'react';
import PropTypes from 'prop-types';
import {
  Space, Divider, Card, Row, Col,
} from 'antd';
import Link from 'next/link';
import Header from 'components/Header';

import { plotNames } from 'utils/constants';

import heatmap from '../../../../../public/static/media/heatmap.png';
import embeddingContinuous from '../../../../../public/static/media/embeddingContinuous.png';
import embeddingCategorical from '../../../../../public/static/media/embeddingCategorical.png';
import violin from '../../../../../public/static/media/violin.png';
import dotPlot from '../../../../../public/static/media/dotplot.png';
import volcano from '../../../../../public/static/media/volcano.png';
import frequency from '../../../../../public/static/media/frequency.png';
import markerHeatmap from '../../../../../public/static/media/marker_heatmap.png';

const CARD_STYLE = { marginBottom: '1em' };
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
        height: '200px', width: '250px', align: 'center', padding: '10px',
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
      title: 'Cell sets & metadata',
      plots: [
        {
          name: plotNames.CATEGORICAL_EMBEDDING,
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
    {
      title: 'Gene expression',
      plots: [
        {
          name: plotNames.CONTINUOUS_EMBEDDING,
          image: embeddingContinuous,
          key: 'embedding-continuous-key',
          link: 'embedding-continuous',
        },
        {
          name: plotNames.MARKER_HEATMAP,
          image: markerHeatmap,
          key: 'marker-heatmap-key',
          link: 'marker-heatmap',
        },
        {
          name: plotNames.HEATMAP,
          image: heatmap,
          key: 'heatmap-key',
          link: 'heatmap',
        },
        {
          name: plotNames.VIOLIN_PLOT,
          image: violin,
          key: 'violin-key',
          link: 'violin',
        },
        {
          name: plotNames.DOT_PLOT,
          image: dotPlot,
          key: 'dot-key',
          link: 'dot-plot',
        },
      ],
    },
    {
      title: 'Differential expression',
      plots: [
        {
          name: plotNames.VOLCANO_PLOT,
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
    <Space style={{ padding: '0 1em' }} direction='vertical'>
      {plots.map((section) => (
        <Row gutter='16'>
          <Col span={24}>
            <Divider
              orientation='left'
              orientationMargin='0'
            >
              <strong>{section.title}</strong>
            </Divider>
          </Col>
          {section.plots.map((item) => (
            <Col className='plot-card'>
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
      ))}
    </Space>
  </>
);
};

PlotsTablesHome.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default PlotsTablesHome;
