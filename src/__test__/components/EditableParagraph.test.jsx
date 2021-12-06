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
});
