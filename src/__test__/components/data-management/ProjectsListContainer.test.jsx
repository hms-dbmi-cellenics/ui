import React from 'react';
import { Provider } from 'react-redux';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { act } from 'react-dom/test-utils';

import { makeStore } from 'redux/store';

import ProjectsListContainer from 'components/data-management/ProjectsListContainer';

import '__test__/test-utils/setupTests';

describe('ProjectsList', () => {
  let storeState;

  beforeEach(() => {
    storeState = makeStore();
  });

  it('Contains the input box and create project button', async () => {
    render(
      <Provider store={storeState}>
        <ProjectsListContainer />
      </Provider>,
    );

    expect(screen.getByPlaceholderText(/Filter by project name/i)).toBeDefined();
    expect(screen.getByText(/Create New Project/)).toBeDefined();
  });

  it('triggers onCreateNewProject on clicking create new project button', () => {
    const onCreateNewProjectMock = jest.fn(() => { });

    render(
      <Provider store={storeState}>
        <ProjectsListContainer onCreateNewProject={onCreateNewProjectMock} />
      </Provider>,
    );

    const createNewProjectButton = screen.getByText(/Create New Project/);

    expect(onCreateNewProjectMock).toHaveBeenCalledTimes(0);

    act(() => {
      userEvent.click(createNewProjectButton);
    });

    expect(onCreateNewProjectMock).toHaveBeenCalledTimes(1);
  });
});
