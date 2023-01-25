/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space, Typography, Button, Dropdown, Menu,
} from 'antd';
import {
  cloneExperiment, updateExperiment, loadExperiments, setActiveExperiment,
} from 'redux/actions/experiments';

import SampleOptions from 'components/data-management/SamplesOptions';
import EditableParagraph from 'components/EditableParagraph';
import { layout } from 'utils/constants';

import SamplesTable from 'components/data-management/SamplesTable';
import ProjectMenu from 'components/data-management/ProjectMenu';
import AddMetadataButton from './AddMetadataButton';

const { Text, Title } = Typography;

const paddingTop = layout.PANEL_PADDING;
const paddingBottom = layout.PANEL_PADDING;
const paddingRight = layout.PANEL_PADDING;
const paddingLeft = layout.PANEL_PADDING;

const ProjectDetails = ({ width, height }) => {
  const dispatch = useDispatch();

  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const samplesTableRef = useRef();
  const parentExperimentId = activeExperiment?.parentExperimentId;

  const clone = async () => {
    const newExperimentId = await dispatch(cloneExperiment(activeExperimentId, `Copy of ${activeExperiment.name}`));
    await dispatch(loadExperiments());
    dispatch(setActiveExperiment(newExperimentId));
  };

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
                onClick={clone}
                disabled={parentExperimentId}
              >
                Copy
              </Button>
              <AddMetadataButton samplesTableRef={samplesTableRef} />
              <ProjectMenu />
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
          <SampleOptions />
          <SamplesTable
            ref={samplesTableRef}
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
