import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Space, Button, Input, Tooltip,
} from 'antd';

import { validate } from 'uuid';

import { createProject, loadProjects } from '../../redux/actions/projects';
import { loadExperiments } from '../../redux/actions/experiments';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import loadBackendStatus from '../../redux/actions/backendStatus/loadBackendStatus';

import NewProjectModal from './NewProjectModal';
import LoadingModal from '../LoadingModal';
import ProjectsList from './ProjectsList';

const ProjectsListContainer = (props) => {
  const { height } = props;

  const dispatch = useDispatch();

  const [filterParam, setFilterParam] = useState('');

  const debouncedSetFilterParam = useCallback(
    _.debounce((value) => {
      setFilterParam(new RegExp(value, 'ig'));
    }, 400),
    [],
  );

  const projectsList = useSelector(((state) => state.projects));

  const {
    saving: projectSaving,
  } = projectsList.meta;

  const {
    saving: sampleSaving,
  } = useSelector((state) => state.samples.meta);

  const {
    activeProjectUuid,
    loading: projectsLoading,
  } = useSelector((state) => state.projects.meta);

  const experiments = useSelector((state) => state.experiments);
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(true);
  const activeProject = projectsList[activeProjectUuid];

  const existingExperiments = activeProject?.experiments
    .map((experimentId) => experiments[experimentId]);

  const experimentIds = new Set(experiments.ids);
  const experimentsAreLoaded = activeProject?.experiments
    .every((experimentId) => experimentIds.has(experimentId));
  const isUuid = (uuid) => {
    const substrings = uuid.split('-');

    // If UUID is prefixed with sandbox_id, remove prefix
    const projectUuid = substrings.length > 5 ? substrings.slice(-5).join('-') : uuid;

    return validate(projectUuid);
  };

  // const experimentsAreLoaded = (project, experiments) => {}
  useEffect(() => {
    if (projectsList.ids.length === 0) dispatch(loadProjects());
  }, []);

  const updateRunStatus = async (experimentId) => {
    dispatch(loadBackendStatus(experimentId));
  };

  useEffect(() => {
    // old experiments don't have a project so the activeProjectUuid will actually be an experiment
    // ID so the experiments load will fail this should be addressed by migrating experiments.
    // However, for now, if the activeProjectUuid is not a Uuid it means that it's an old experiment
    // and we should not try to load the experiments with it

    if (
      !activeProjectUuid
      || !isUuid(activeProjectUuid)
      || !projectsList[activeProjectUuid]?.experiments
      || !projectsList[activeProjectUuid]?.experiments[0]
    ) return;

    // Right now we have one experiment per project, so we can just load the experiment
    // This has to be changed when we have more than one experiment
    const activeExperimentId = projectsList[activeProjectUuid].experiments[0];

    dispatch(loadProcessingSettings(activeExperimentId));

    if (!experimentsAreLoaded) {
      dispatch(loadExperiments(activeProjectUuid)).then(() => updateRunStatus(activeExperimentId));
    }

    if (experiments[activeExperimentId]) updateRunStatus(activeExperimentId);
  }, [activeProjectUuid]);

  useEffect(() => {
    // only open the modal the first time a user logs in if there are no projects
    if (justLoggedIn === false || projectsLoading === true) {
      return;
    }

    setJustLoggedIn(false);

    if (projectsList.ids.length === 0) {
      setNewProjectModalVisible(true);
    }
  }, [projectsList, projectsLoading]);

  const unnamedExperimentName = 'Unnamed Analysis';

  const createNewProject = (newProjectName, newProjectDescription) => {
    const numUnnamedExperiments = !existingExperiments?.[0] ? 0
      : existingExperiments.filter((experiment) => experiment.name.match(`${unnamedExperimentName} `)).length;
    const newExperimentName = `${unnamedExperimentName} ${numUnnamedExperiments + 1}`;

    dispatch(createProject(newProjectName, newProjectDescription, newExperimentName));
    setNewProjectModalVisible(false);
  };

  return (
    <>
      <LoadingModal
        visible={Boolean(projectSaving || sampleSaving)}
        message={projectSaving ?? sampleSaving ?? ''}
      />
      <NewProjectModal
        visible={newProjectModalVisible}
        firstTimeFlow={projectsList.ids.length === 0}
        onCancel={() => { setNewProjectModalVisible(false); }}
        onCreate={createNewProject}
        projects={projectsList}
      />
      <Space
        direction='vertical'
        style={{ width: '100%' }}
      >
        <Button
          data-test-id='create-new-project-button'
          type='primary'
          block
          onClick={() => setNewProjectModalVisible(true)}
        >
          Create New Project
        </Button>
        <Tooltip title='Insert project name, project ID or analysis ID here to filter the list'>
          <Input placeholder='Filter by project name, project ID or analysis ID' onChange={(e) => debouncedSetFilterParam(e.target.value)} />
        </Tooltip>
        <Space direction='vertical' style={{ width: '100%', overflowY: 'auto' }}>
          <ProjectsList height={height} filter={filterParam} />
        </Space>
      </Space>
    </>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number.isRequired,
};

export default ProjectsListContainer;
