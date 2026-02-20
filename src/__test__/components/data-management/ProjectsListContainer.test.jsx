import '@testing-library/jest-dom';
import '__test__/test-utils/setupTests';

import { render, screen } from '@testing-library/react';

import ProjectsListContainer from 'components/data-management/project/ProjectsListContainer';
import { Provider } from 'react-redux';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { makeStore } from 'redux/store';
import userEvent from '@testing-library/user-event';

describe('ProjectsList', () => {
  let storeState;

  beforeEach(() => {
    storeState = makeStore();
  });

  it('Contains the input box and create project button', async () => {
    render(
      <Provider store={storeState}>
        <ProjectsListContainer onCreateNewProject={() => { }} />
      </Provider>,
    );

    expect(screen.getByPlaceholderText(/Filter by project name/i)).toBeDefined();
    expect(screen.getByText(/Create New Project/)).toBeDefined();
  });

  it('triggers onCreateNewProject on clicking create new project button', async () => {
    const onCreateNewProjectMock = jest.fn(() => { });

    render(
      <Provider store={storeState}>
        <ProjectsListContainer onCreateNewProject={onCreateNewProjectMock} />
      </Provider>,
    );

    const createNewProjectButton = screen.getByText(/Create New Project/);

    expect(onCreateNewProjectMock).toHaveBeenCalledTimes(0);

    await act(async () => {
      userEvent.click(createNewProjectButton);
    });

    expect(onCreateNewProjectMock).toHaveBeenCalledTimes(1);
  });
});
