/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space, Typography, Button,
} from 'antd';

import { updateExperiment } from 'redux/actions/experiments';

import { layout } from 'utils/constants';
import EditableParagraph from 'components/EditableParagraph';
import SamplesTable from './SamplesTable';
import ProjectMenu from './ProjectMenu';

const {
  Title, Text,
} = Typography;

const paddingTop = layout.PANEL_PADDING;
const paddingBottom = layout.PANEL_PADDING;
const paddingRight = layout.PANEL_PADDING;
const paddingLeft = layout.PANEL_PADDING;

const ProjectDetails = ({ width, height }) => {
  const dispatch = useDispatch();

  const samples = useSelector((state) => state.samples);
  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const samplesTableRef = useRef();

  const [technology, setTechnology] = useState();

  useEffect(() => {
    const samplesLoaded = activeExperiment?.sampleIds.every((sampleId) => samples[sampleId]);

    if (activeExperiment?.sampleIds.length > 0 && samplesLoaded) {
      const isSeurat = activeExperiment.sampleIds.some((sampleId) => samples[sampleId].type === 'Seurat');
      setTechnology(isSeurat ? 'seurat' : '10x');
    } else {
      setTechnology(null);
    }
  }, [samples, activeExperiment]);

  return (
    // The height of this div has to be fixed to enable sample scrolling
    <div
      id='project-details'
      style={{
        width: width - paddingLeft - paddingRight,
        height: height - layout.PANEL_HEADING_HEIGHT - paddingTop - paddingBottom,
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      }}
      >
        <div style={{ flex: 'none', paddingBottom: '1em' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Title level={3}>{activeExperiment.name}</Title>
            <Space>
              <Button
                disabled={activeExperiment.sampleIds?.length === 0 || technology === 'seurat'}
                onClick={() => samplesTableRef.current.createMetadataColumn()}
              >
                Add metadata
              </Button>
              <ProjectMenu
                technology={technology}
              />
            </Space>
          </div>
          <Text type='secondary'>
            {`Project ID: ${activeExperimentId}`}
          </Text>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Text strong>
            Description:
          </Text>
          <EditableParagraph
            value={activeExperiment.description}
            onUpdate={(text) => {
              if (text !== activeExperiment.description) {
                dispatch(updateExperiment(activeExperimentId, { description: text }));
              }
            }}
          />
          <SamplesTable
            ref={samplesTableRef}
            technology={technology}
          />
        </div>
      </div>
    </div>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
