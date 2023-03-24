import '@testing-library/jest-dom';

import { render, screen, fireEvent } from '@testing-library/react';

import ProjectsListContainer from 'components/data-management/ProjectsListContainer';
import { Provider } from 'react-redux';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { makeStore } from 'redux/store';
import userEvent from '@testing-library/user-event';

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

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
    fireEvent.click(screen.getByText('Upload Project'));

    expect(onCreateNewProjectMock).toHaveBeenCalledTimes(1);
  });

  it('navigates to repository page when selecting the option in the create project dropdown', async () => {
    render(
      <Provider store={storeState}>
        <ProjectsListContainer />
      </Provider>,
    );

    const createNewProjectButton = screen.getByText(/Create New Project/);

    await act(async () => {
      userEvent.click(createNewProjectButton);
    });
    fireEvent.click(screen.getByText('Select from Dataset Repository'));

    expect(mockNavigateTo.mock.calls).toMatchSnapshot();
  });
});
