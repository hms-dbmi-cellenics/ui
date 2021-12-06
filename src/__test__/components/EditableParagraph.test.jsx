import { screen, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import EditableParagraph from 'components/EditableParagraph';

const defaultProps = {
  value: '',
  onUpdate: jest.fn(),
};

const editableParagraphFactory = createTestComponentFactory(EditableParagraph, defaultProps);

const renderEditableParagraph = (props = {}) => render(editableParagraphFactory(props));

describe('EdtableParagraph', () => {
  it('Should render an editable paragraph without extend/collapse', () => {
    renderEditableParagraph();

    // It should show the editable button
    expect(screen.getByLabelText(/edit/i)).toBeInTheDocument();

    // It should not show the less / more link
    expect(screen.queryByText(/less/i)).toBeNull();
    expect(screen.queryByText(/more/i)).toBeNull();
  });

  it('Should be editable', () => {
    const { container } = renderEditableParagraph();

    const mockContent = 'This is a mock content';

    act(() => {
      userEvent.click(screen.getByLabelText(/edit/i));
    });

    const descriptionInput = container.querySelector('p[contenteditable="true"]');

    act(() => {
      userEvent.type(descriptionInput, `${mockContent}{enter}`);
    });

    expect(defaultProps.onUpdate).toHaveBeenCalledWith(mockContent);
    expect(screen.getByText(mockContent)).toBeInTheDocument();

    // Description is shortened by default
    expect(screen.queryByText(/more/i)).toBeInTheDocument();
  });

  it('Clicking outside the paragraph should cause the paragraph to update', () => {
    const { container } = renderEditableParagraph();

    const mockContent = 'This is a mock content';

    act(() => {
      userEvent.click(screen.getByLabelText(/edit/i));
    });

    const descriptionInput = container.querySelector('p[contenteditable="true"]');

    act(() => {
      userEvent.type(descriptionInput, `${mockContent}`);
    });

    userEvent.click(document.body);

    expect(defaultProps.onUpdate).toHaveBeenCalledWith(mockContent);
    expect(screen.getByText(mockContent)).toBeInTheDocument();

    // Description is shortened by default
    expect(screen.queryByText(/more/i)).toBeInTheDocument();
  });

  // We can not test if the content will be ellipsized properly because
  // we are useing CSS to create the ellipsis effect
  it('More and less toggles correctly', () => {
    const moreText = 'more';
    const lessText = 'less';

    renderEditableParagraph({
      value: 'This is a mock content',
    });

    // Contains more by default
    expect(screen.getByText(moreText)).toBeInTheDocument();
    expect(screen.queryByText(lessText)).toBeNull();

    // Toggles to less
    act(() => {
      userEvent.click(screen.getByText(moreText));
    });
    expect(screen.getByText(lessText)).toBeInTheDocument();
    expect(screen.queryByText(moreText)).toBeNull();

    // Toggles to more
    act(() => {
      userEvent.click(screen.getByText(lessText));
    });
    expect(screen.getByText(moreText)).toBeInTheDocument();
    expect(screen.queryByText(lessText)).toBeNull();

    act(() => {
      userEvent.click(screen.getByText(moreText));
    });

    // Toggles to less
    expect(screen.getByText(lessText)).toBeInTheDocument();
    expect(screen.queryByText(moreText)).toBeNull();
  });
});
