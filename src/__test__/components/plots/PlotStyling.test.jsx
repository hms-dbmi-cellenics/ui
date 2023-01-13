import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import PlotStyling from 'components/plots/styling/PlotStyling';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const mockOnUpdate = jest.fn();

const defaultStylingConfig = [
  {
    panelTitle: 'Main schema',
    controls: ['dimensions'],
    children: [
      {
        panelTitle: 'Title',
        controls: ['title'],
      },
      {
        panelTitle: 'Font',
        controls: ['font'],
      },
    ],
  },
  {
    panelTitle: 'Axes and margins',
    controls: ['axesWithRanges'],
  },
];

const defaultProps = {
  onUpdate: mockOnUpdate,
  formConfig: defaultStylingConfig,
  config: initialPlotConfigStates.embeddingCategorical,
};

const plotStylingFactory = createTestComponentFactory(PlotStyling, defaultProps);

const renderPlotStyling = (props) => {
  render(plotStylingFactory(props));
};

describe('PlotStyling', () => {
  it('Renders properly with the correct config', () => {
    renderPlotStyling();
    expect(screen.getByText('Main schema')).toBeInTheDocument();
  });

  it('Renders properly with no external config', () => {
    renderPlotStyling();

    userEvent.click(screen.getByText('Main schema'));
    expect(screen.getByText('Main schema')).toBeInTheDocument();
  });

  it('Renders axes ranges controls', () => {
    renderPlotStyling();

    userEvent.click(screen.getByText('Axes and margins'));
    userEvent.click(screen.getByText('Axes Ranges'));

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('Changes and saves axes ranges', () => {
    renderPlotStyling();

    userEvent.click(screen.getByText('Axes and margins'));
    userEvent.click(screen.getByText('Axes Ranges'));

    const yAuto = screen.getByTestId('yAuto');
    const save = screen.getByTestId('save');

    expect(save).toBeDisabled();

    userEvent.click(yAuto);

    expect(save).not.toBeDisabled();

    const yMin = screen.getByTestId('yMin');
    const yMax = screen.getByTestId('yMax');

    userEvent.type(yMin, '{backspace}{backspace}{backspace}100');
    expect(yMin).toHaveValue('100');

    expect(save).toBeDisabled();

    userEvent.type(yMax, '{backspace}{backspace}150');
    expect(yMax).toHaveValue('150');

    expect(save).not.toBeDisabled();

    const xAuto = screen.getByTestId('xAuto');
    userEvent.click(xAuto);

    const xMin = screen.getByTestId('xMin');
    const xMax = screen.getByTestId('xMax');

    userEvent.type(xMin, '{backspace}{backspace}{backspace}-10');
    expect(xMin).toHaveValue('-10');

    userEvent.type(xMax, '{backspace}{backspace}20');
    expect(xMax).toHaveValue('20');

    userEvent.click(save);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });
});
