import React from 'react';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GeneSearchBar from 'components/plots/GeneSearchBar';

// Mock the getGeneList selector
jest.mock('redux/selectors', () => ({
  getGeneList: () => () => ({
    data: {
      GENE: { dispersions: 0.233 },
      ANOTHERGENE: { dispersions: 0.555 },
    },
  }),
}));

const mockStore = configureStore();
const store = mockStore({});

const renderWithStore = (component) => render(<Provider store={store}>{component}</Provider>);

describe('GeneSearchBar', () => {
  it('should render search bar with placeholder', () => {
    renderWithStore(<GeneSearchBar onSelect={() => {}} />);

    const input = screen.getByText('Search for genes...');
    expect(input).toBeInTheDocument();
  });

  it('should filter gene list based on input', async () => {
    renderWithStore(<GeneSearchBar allowMultiple={false} onSelect={() => {}} />);

    const input = screen.getByText('Search for a gene...');
    userEvent.type(input, 'GE');

    await waitFor(() => {
      expect(screen.getAllByText('GENE').length).toEqual(2);
    });
  });

  it('should call onSelect when clicking on the button with valid gene input', async () => {
    const onSelectMock = jest.fn();
    renderWithStore(<GeneSearchBar onSelect={onSelectMock} />);

    const input = screen.getByText('Search for genes...');
    userEvent.type(input, 'GENE');

    const button = screen.getByText('Add');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onSelectMock).toHaveBeenCalledWith(['GENE']);
    });
  });
});
