import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import PlotStyling from 'components/plots/styling/PlotStyling';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

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
    controls: ['axes'],
  },
];

const defaultProps = {
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
});
