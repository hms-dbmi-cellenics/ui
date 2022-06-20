import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button, Space, Empty,
} from 'antd';

import { ClipLoader } from 'react-spinners';
import { loadProjects } from 'redux/actions/projects';
import { loadExperiments } from 'redux/actions/experiments';

import Header from 'components/Header';
import MultiTileContainer from 'components/MultiTileContainer';
import NewProjectModal from 'components/data-management/NewProjectModal';
import ProjectsListContainer from 'components/data-management/ProjectsListContainer';
import ProjectDetails from 'components/data-management/ProjectDetails';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import { loadSamples } from 'redux/actions/samples';

const DataManagementPage = () => {
  const dispatch = useDispatch();
  const projectsList = useSelector(((state) => state.projects));

  const {
    saving: projectSaving,
  } = projectsList.meta;

  const sampleSaving = useSelector((state) => state.samples.meta.saving);

  const {
    activeProjectUuid,
    loading: projectsLoading,
  } = useSelector((state) => state.projects.meta);

  const experiments = useSelector((state) => state.experiments);
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(true);
  const activeProject = projectsList[activeProjectUuid];
  const loadedSamples = useSelector((state) => state.samples);

  const experimentIds = new Set(experiments.ids);
  const experimentsAreLoaded = activeProject?.experiments
    .every((experimentId) => experimentIds.has(experimentId));

  useEffect(() => {
    if (projectsList.ids.length === 0) dispatch(loadProjects());
  }, []);

  const updateRunStatus = (experimentId) => {
    dispatch(loadBackendStatus(experimentId));
  };

  const areSamplesLoaded = () => !activeProject.samples.length
    || activeProject.samples.every((sample) => Object.keys(loadedSamples).includes(sample));

  useEffect(() => {
    if (!activeProjectUuid) return;

    // Right now we have one experiment per project, so we can just load the experiment
    // This has to be changed when we have more than one experiment
    const activeExperimentId = projectsList[activeProjectUuid].experiments[0];

    dispatch(loadProcessingSettings(activeExperimentId));

    console.log(areSamplesLoaded());
    if (!areSamplesLoaded()) dispatch(loadSamples(null, activeProjectUuid));

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

  const PROJECTS_LIST = 'Projects';
  const PROJECT_DETAILS = 'Project Details';

  const TILE_MAP = {
    [PROJECTS_LIST]: {
      toolbarControls: [],
      component: (width, height) => (
        <ProjectsListContainer
          height={height}
          onCreateNewProject={() => setNewProjectModalVisible(true)}
        />
      ),
    },
    [PROJECT_DETAILS]: {
      toolbarControls: [],
      component: (width, height) => {
        if (!activeProjectUuid) {
          return (
            <Empty
              description='You have no projects yet.'
            >
              <Button type='primary' onClick={() => setNewProjectModalVisible(true)}>Get started</Button>
            </Empty>
          );
        }

        return (
          <ProjectDetails
            width={width}
            height={height}
          />
        );
      },
    },
  };

  const windows = {
    direction: 'row',
    first: PROJECTS_LIST,
    second: PROJECT_DETAILS,
    splitPercentage: 23,
  };

  return (
    <>
      <Header title='Data Management' />
      {projectSaving || sampleSaving ? (
        <center>
          <Space direction='vertical'>
            <ClipLoader
              size={50}
              color='#8f0b10'
            />
            Loading...
          </Space>
        </center>
      ) : (<></>)}
      {newProjectModalVisible ? (
        <NewProjectModal
          onCancel={() => { setNewProjectModalVisible(false); }}
          onCreate={() => { setNewProjectModalVisible(false); }}
        />
      ) : (<></>)}
      <MultiTileContainer
        tileMap={TILE_MAP}
        initialArrangement={windows}
      />
    </>
  );
};

export default DataManagementPage;
