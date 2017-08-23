import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

storiesOf('Button', module).addDecorator(withKnobs).add(
  'Default',
  withInfo()(() =>
    <button disabled={boolean('Disabled', false)}>
      {text('Label', 'Button label')}
    </button>,
  ),
);
