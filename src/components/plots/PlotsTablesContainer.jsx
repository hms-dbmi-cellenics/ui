import React from 'react';
import PropTypes from 'prop-types';
import {
  Space, Divider, Card, Row, Col,
} from 'antd';
import Link from 'next/link';

import { plotNames, layout } from 'utils/constants';

const CARD_STYLE = { marginBottom: '1em' };
const CardItem = (({
  item, experimentId,
}) => (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events
  <div style={{ cursor: 'pointer' }}>
    <Card.Grid
      hoverable={false}
      style={{ textAlign: 'center', width: '100%', padding: '0' }}
    >
      <Link
        as={`/experiments/${experimentId}/plots-and-tables/${item.link}`}
        href={`/experiments/[experimentId]/plots-and-tables/${item.link}`}
        passHref
      >
        <img
          alt={item.name}
          src={item.image}
          style={{
            height: '200px', width: '250px', align: 'center', padding: '10px',
          }}
        />
      </Link>
    </Card.Grid>
  </div>
));

CardItem.propTypes = {
  item: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
};

const plots = [
  {
    title: 'Cell sets & metadata',
    plots: [
      {
        name: plotNames.CATEGORICAL_EMBEDDING,
        image: '/static/media/embeddingCategorical.png',
        key: 'embedding-categorical-key',
        link: 'embedding-categorical',
      },
      {
        name: 'Frequency Plot',
        image: '/static/media/frequency.png',
        key: 'frequency-key',
        link: 'frequency',
      },
      {
        name: 'Trajectory Analysis',
        image: '/static/media/trajectory_analysis.png',
        key: 'trajectory-analysis-key',
        link: 'trajectory-analysis',
      },
    ],
  },
  {
    title: 'Gene expression',
    plots: [
      {
        name: plotNames.CONTINUOUS_EMBEDDING,
        image: '/static/media/embeddingContinuous.png',
        key: 'embedding-continuous-key',
        link: 'embedding-continuous',
      },
      {
        name: plotNames.MARKER_HEATMAP,
        image: '/static/media/marker_heatmap.png',
        key: 'marker-heatmap-key',
        link: 'marker-heatmap',
      },
      {
        name: plotNames.VIOLIN_PLOT,
        image: '/static/media/violin.png',
        key: 'violin-key',
        link: 'violin',
      },
      {
        name: plotNames.DOT_PLOT,
        image: '/static/media/dotplot.png',
        key: 'dot-key',
        link: 'dot-plot',
      },
      {
        name: plotNames.NORMALIZED_EXPRESSION_MATRIX,
        image: '/static/media/normalized_expression_matrix.png',
        key: 'normalized-matrix-key',
        link: 'normalized-matrix',
      },
    ],
  },
  {
    title: 'Differential expression',
    plots: [
      {
        name: plotNames.VOLCANO_PLOT,
        image: '/static/media/volcano.png',
        key: 'volcano-key',
        link: 'volcano',
      },
      {
        name: plotNames.BATCH_DIFFERENTIAL_EXPRESSION,
        image: '/static/media/batch-de.png',
        key: 'batch-differential-expression-key',
        link: 'batch-differential-expression',
      },
    ],
  },
];

const PlotsTablesContainer = (props) => {
  const { width, height, experimentId } = props;

  return (
    <div
      style={{
        width: width - (layout.PANEL_PADDING * 2),
        height: height - (layout.PANEL_HEADING_HEIGHT * 2),
        overflowY: 'auto',
      }}
    >
      <Space style={{ padding: '0 1em' }} direction='vertical'>
        {plots.map((section) => (
          <Row gutter='16' key={section.title}>
            <Col span={24}>
              <Divider
                orientation='left'
                orientationMargin='0'
              >
                <strong>{section.title}</strong>
              </Divider>
            </Col>
            {section.plots.map((item) => (
              <Col className='plot-card' key={item.key}>
                <Card
                  size='small'
                  hoverable
                  title={item.name}
                  bodyStyle={{ padding: '0' }}
                  style={CARD_STYLE}
                >
                  <CardItem item={item} experimentId={experimentId} />
                </Card>
              </Col>
            ))}
          </Row>
        ))}
      </Space>
    </div>
  );
};

PlotsTablesContainer.propTypes = {
  experimentId: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};

PlotsTablesContainer.defaultProps = {
  width: null,
  height: null,
};

export default PlotsTablesContainer;
