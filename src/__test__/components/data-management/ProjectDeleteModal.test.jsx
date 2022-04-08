import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import {
  screen, render, fireEvent, waitFor,
} from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import initialProjectState from 'redux/reducers/projects/initialState';
import ProjectDeleteModal from 'components/data-management/ProjectDeleteModal';

const mockStore = configureMockStore([thunk]);
const projectName = 'super cool project';
const projectId = 'iamid';
const state = {
  projects: {
    ...initialProjectState,
    ids: [projectId],
    [projectId]: {
      name: projectName,
    },
    meta: {
      ...initialProjectState.meta,
      loading: false,
    },
  },
};
const deleteProjectSpy = jest.fn();
const cancelProjectSpy = jest.fn();

describe('Delete Project Modal tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const renderProjectDeleteModal = () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <ProjectDeleteModal
          projectUuid={projectId}
          onDelete={deleteProjectSpy}
          onCancel={cancelProjectSpy}
        />
      </Provider>,
    );
  };

  it('has cancel and ok button', async () => {
    renderProjectDeleteModal();
    expect(screen.getByText('Keep project')).toBeInTheDocument();
    expect(screen.getByText('Permanently delete project')).toBeInTheDocument();
  });

  it('ok button is disabled by default', () => {
    renderProjectDeleteModal();
    expect(screen.getByText('Permanently delete project').parentElement).toBeDisabled();
  });

  it('ok button is not disabled if project name is typed in', () => {
    renderProjectDeleteModal();
    const nameField = screen.getByRole('textbox');
    fireEvent.change(nameField, { target: { value: projectName } });
    expect(screen.getByText('Permanently delete project').parentElement).not.toBeDisabled();
  });

  it('Calls delete on deletion', async () => {
    renderProjectDeleteModal();
    const nameField = screen.getByRole('textbox');
    fireEvent.change(nameField, { target: { value: projectName } });
    fireEvent.click(screen.getByText('Permanently delete project').parentElement);
    await waitFor(() => expect(deleteProjectSpy).toHaveBeenCalled());
  });

  it('Calls cancel when delete is cancelled', async () => {
    renderProjectDeleteModal();
    fireEvent.click(screen.getByText('Keep project'));
    await waitFor(() => expect(cancelProjectSpy).toHaveBeenCalled());
  });

  it('Calls cancel when closed', async () => {
    renderProjectDeleteModal();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(cancelProjectSpy).toHaveBeenCalled());
  });
});
