import React from 'react';
import _ from 'lodash';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import fakeConfig from '__test__/data/componentConfigs/embeddingContinuous.json';

import SingleGeneSelection from 'components/plots/styling/SingleGeneSelection';

const loadAndRenderSingleGeneSelection = async (config, setSearchedGene) => {
  await act(async () => {
    render(
      <SingleGeneSelection
        config={config}
        setSearchedGene={setSearchedGene}
      />,
    );
  });
};

describe('SingleGeneSelection', () => {
  it('Shows gene received in props initially', async () => {
    await loadAndRenderSingleGeneSelection(fakeConfig, () => { });

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('value', fakeConfig.shownGene);
  });

  it('Updates on gene config being loaded later on', async () => {
    const config = _.cloneDeep(fakeConfig);
    config.shownGene = null;

    await loadAndRenderSingleGeneSelection(config, () => { });

    expect(screen.getByTestId('skeletonInput')).toBeDefined();

    config.shownGene = 'Lyz2';

    // This is how prop changes are simulated in rtl, based on https://testing-library.com/docs/example-update-props/
    await loadAndRenderSingleGeneSelection(config, () => { });

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('value', 'Lyz2');
  });

  it('Manages user actions correctly', async () => {
    const callback = jest.fn();
    await loadAndRenderSingleGeneSelection(fakeConfig, callback);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('value', fakeConfig.shownGene);

    // On clearing the current input
    userEvent.type(input, '{selectall}');
    userEvent.type(input, '{backspace}');

    // Callback isn't triggered but input is cleared
    expect(input).toHaveAttribute('value', '');
    expect(callback).not.toHaveBeenCalled();

    // On writing the new gene name
    userEvent.type(input, 'Lyz2');

    // Callback isn't triggered but input has new gene name
    expect(input).toHaveAttribute('value', 'Lyz2');
    expect(callback).not.toHaveBeenCalled();

    // On pressing enter
    userEvent.type(input, '{enter}');
    // Callback is triggered and input doesn't change
    expect(input).toHaveAttribute('value', 'Lyz2');
    expect(callback).toHaveBeenCalledWith('Lyz2');
  });
});
