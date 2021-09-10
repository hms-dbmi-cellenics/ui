import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Space } from 'antd';

import ProjectDeleteModal from './ProjectDeleteModal';
import { setActiveProject, updateProject, deleteProject as deleteProjectAction } from '../../redux/actions/projects';
import ProjectCard from './ProjectCard';
import validateInputs, { rules } from '../../utils/validateInputs';

const validationChecks = [
  rules.MIN_8_CHARS,
  rules.MIN_2_SEQUENTIAL_CHARS,
  rules.ALPHANUM_DASH_SPACE,
  rules.UNIQUE_NAME_CASE_INSENSITIVE,
];

const ProjectsListContainer = (props) => {
  const { height, filter } = props;
  const dispatch = useDispatch();

  const projects = useSelector((state) => state.projects);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteProjectUuid, setDeleteProjectUuid] = useState(false);
  const [projectNames, setProjectNames] = useState(new Set());

  const validationParams = {
    existingNames: projectNames,
  };

  const searchable = projects.ids.map((projectUuid) => {
    const project = projects[projectUuid];

    const searchObj = {
      projectUuid,
      projectName: project.name,
      experiments: project.experiments,
    };

    return [
      searchObj,
      project,
    ];
  });

  useEffect(() => {
    setProjectNames(new Set(projects.ids.map((id) => projects[id].name.trim())));
  }, [projects.ids]);

  const activeProjectUuid = useSelector((state) => state.projects.meta.activeProjectUuid);

  const deleteProject = () => {
    dispatch(deleteProjectAction(deleteProjectUuid));
    setDeleteModalVisible(false);
  };

  const matcher = (searchObj, filterRegex) => searchObj.projectName.match(filterRegex)
      || searchObj.experiments.some((experimentId) => experimentId.match(filterRegex))
      || searchObj.projectUuid.match(filterRegex);

  return (
    <>
      {deleteModalVisible && (
        <ProjectDeleteModal
          visible={deleteModalVisible}
          onCancel={() => { setDeleteModalVisible(false); }}
          onDelete={deleteProject}
          projectName={projects[deleteProjectUuid]?.name}
        />
      )}
      <Space direction='vertical' style={{ width: '100%', height: height - 90 }}>
        {
          searchable
            .filter(([searchObj]) => matcher(searchObj, filter))
            .map(([_, project]) => (
              <ProjectCard
                key={project.uuid}
                isActive={project.uuid === activeProjectUuid}
                uuid={project.uuid}
                onClick={() => {
                  dispatch(setActiveProject(project.uuid));
                }}
                onSubmit={(newName) => {
                  dispatch(updateProject(project.uuid, { name: newName }));
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  setDeleteProjectUuid(project.uuid);
                  setDeleteModalVisible(true);
                }}
                validationFunc={
                  (newName) => validateInputs(
                    newName,
                    validationChecks,
                    validationParams,
                  ).isValid
                }
              />
            ))
        }
      </Space>
    </>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number,
  filter: PropTypes.object.isRequired,
};

ProjectsListContainer.defaultProps = {
  height: 800,
};

export default ProjectsListContainer;
