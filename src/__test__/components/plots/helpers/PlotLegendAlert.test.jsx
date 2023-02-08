import React from 'react';
import PlotLegendAlert, {
  MAX_LEGEND_ITEMS,
} from 'components/plots/helpers/PlotLegendAlert';
import { render, screen } from '@testing-library/react';

describe('PlotLegendAlert', () => {
  it('Shows legend message properly', () => {
    render(<PlotLegendAlert />);

    expect(
      screen.getByText(
        /We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You can still display the plot legend by changing the value of "Toggle Legend" option in "Plot styling" settings under "Legend"./gi,
      ),
    ).toBeInTheDocument();
  });

  it('Displays the correct plot styling section name ', () => {
    render(<PlotLegendAlert stylingSectionName='Plot options' />);

    expect(
      screen.getByText(
        /We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You can still display the plot legend by changing the value of "Toggle Legend" option in "Plot options" settings under "Legend"./gi,
      ),
    ).toBeInTheDocument();
  });

  it('Exports the number of max legend items to be shown', () => {
    expect(MAX_LEGEND_ITEMS).toMatchInlineSnapshot('50');
  });
});
