import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom';
import thunk from 'redux-thunk';
import initialProjectState, { projectTemplate } from '../../../redux/reducers/projects/initialState';
import initialBackendStatus from '../../../redux/reducers/backendStatus/initialState';

import ProjectMenu from '../../../components/data-management/ProjectMenu';

const mockStore = configureMockStore([thunk]);

const project1 = {
  ...projectTemplate,
  uuid: 'project-1',
  name: 'project-name',
};

const initialState = {
  projects: {
    ...initialProjectState,
    ids: [project1.uuid],
    meta: {
      ...initialProjectState.meta,
      activeProjectUuid: project1.uuid,
    },
    [project1.uuid]: project1,
  },
  backendStatus: {
    ...initialBackendStatus,
  },
};

describe('ProjectMenu', () => {
  it('Renders correctly when there is a project', () => {
    render(
      <Provider store={mockStore(initialState)}>
        <ProjectMenu />
      </Provider>,
    );

    // Has add samples button
    expect(screen.getByText('Add samples').closest('button')).toBeInTheDocument();

    // Has Download button
    expect(screen.getByText('Download')).toBeInTheDocument();

    // Has Launch analysis button
    expect(screen.getByText('Process project')).toBeInTheDocument();
  });

  it('Clicking Add Samples should bring up the add samples modal', async () => {
    render(
      <Provider store={mockStore(initialState)}>
        <ProjectMenu />
      </Provider>,
    );

    userEvent.click(screen.getByText('Add samples').closest('button'));

    await waitFor(() => expect(screen.getByText('Upload')).toBeInTheDocument());
  });
});
