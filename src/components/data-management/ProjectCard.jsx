import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card, Descriptions,
} from 'antd';
import { blue } from '@ant-design/colors';
import { useSelector, useDispatch } from 'react-redux';
import EditableField from '../EditableField';
import PrettyTime from '../PrettyTime';

import validateInputs, { rules } from '../../utils/validateInputs';
import ProjectDeleteModal from './ProjectDeleteModal';
import { setActiveProject, updateProject } from '../../redux/actions/projects';
import { updateExperiment } from '../../redux/actions/experiments';

import integrationTestConstants from '../../utils/integrationTestConstants';

const { Item } = Descriptions;

const validationChecks = [
  rules.MIN_8_CHARS,
  rules.MIN_2_SEQUENTIAL_CHARS,
  rules.ALPHANUM_DASH_SPACE,
  rules.UNIQUE_NAME_CASE_INSENSITIVE,
];

const inactiveProjectStyle = {
  cursor: 'pointer',
};

const activeProjectStyle = {
  backgroundColor: blue[0],
  cursor: 'pointer',
  border: `2px solid ${blue.primary}`,
};

const itemTextStyle = { fontWeight: 'bold' };

const ProjectCard = (props) => {
  const { projectUuid } = props;

  const dispatch = useDispatch();

  const projects = useSelector((state) => state.projects);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { activeProjectUuid } = projects.meta;
  const projectCardStyle = activeProjectUuid === projectUuid ? activeProjectStyle : inactiveProjectStyle;

  const project = projects[projectUuid];
  const projectExperiment = project.experiments[0];

  const projectNames = projects.ids.map((uuid) => projects[uuid].name);

  const validationParams = {
    existingNames: projectNames,
  };

  const updateProjectName = (newName) => {
    dispatch(updateProject(project.uuid, { name: newName.trim() }));

    // Before multiple experiment support, use project name for analysis name
    dispatch(updateExperiment(projectExperiment, { name: newName.trim() }));
  };

  const deleteProject = () => {
    setDeleteModalVisible(true);
  };

  return (
    <>
      {deleteModalVisible && (
        <ProjectDeleteModal
          key={`${project.uuid}-name`}
          projectUuid={project.uuid}
          onCancel={() => { setDeleteModalVisible(false); }}
          onDelete={() => { setDeleteModalVisible(false); }}
        />
      )}
      <Card
        data-test-class={integrationTestConstants.classes.PROJECT_CARD}
        key={projectUuid}
        type='primary'
        style={projectCardStyle}
        onClick={() => {
          dispatch(setActiveProject(project.uuid));
        }}
      >
        <Descriptions
          layout='horizontal'
          size='small'
          column={1}
        >
          <Item contentStyle={{ fontWeight: 700, fontSize: 16 }}>
            <EditableField
              value={project.name}
              onAfterSubmit={updateProjectName}
              onDelete={deleteProject}
              validationFunc={
                (newName) => validateInputs(
                  newName,
                  validationChecks,
                  validationParams,
                ).isValid
              }
            />
          </Item>
          <Item
            labelStyle={itemTextStyle}
            label='Samples'
          >
            {project.samples.length}

          </Item>
          <Item
            labelStyle={itemTextStyle}
            label='Created'
          >
            <PrettyTime isoTime={project.createdDate} />

          </Item>
          <Item
            labelStyle={itemTextStyle}
            label='Modified'
          >
            <PrettyTime isoTime={project.lastModified} />

          </Item>
        </Descriptions>
      </Card>
    </>
  );
};

ProjectCard.propTypes = {
  projectUuid: PropTypes.string.isRequired,
};

export default ProjectCard;
