import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectSearchBox from 'components/data-management/project/ProjectSearchBox';

const onChangeSpy = jest.fn();

describe('ProjectSearchBox', () => {
  it('Renders properly without inputs', () => {
    render(
      <ProjectSearchBox />,
    );

    // Expect component to contain input
    expect(screen.getByPlaceholderText(/Filter by project/)).toBeInTheDocument();
  });

  it('Fires onchange when typed in', async () => {
    const filterText = 'M musculus';

    render(
      <ProjectSearchBox onChange={onChangeSpy} />,
    );

    // Input value into search box
    const input = screen.getByPlaceholderText(/Filter by project/);
    userEvent.type(input, filterText);

    // Expect onChange spy to be fired
    await waitFor(() => {
      expect(input.value).toBe(filterText);
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });
});
