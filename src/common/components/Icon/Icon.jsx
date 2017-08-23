/* global WP_COMPONENT_DEF */
import React from 'react';
import PropTypes from 'prop-types';
import { withFunctionalClassName } from 'src/common/util/componentClassNameUtils';

import './icon.scss';

const spriteSrc = require('./sprite.svg');

/**
 * Icon component based on sprite file
 *
 * Usage: Generate sprite from assets with 'npm run icon-sprite'
 * Or run them independently:
 * Convert assets to sprite 'npm run icon-sprite:convert'
 * Optimize sprite.svg 'npm run icon-sprite:optimize'
 *
 * @param name
 * @param size
 * @param inline
 * @param useOwnColor
 */
const Icon = ({ name, size }, context, className) =>
  <span className={className}>
    <svg width={`${size}px`} height={`${size}px`} className={`icon icon-${name}`}>
      <use xlinkHref={`${spriteSrc}#${name}`} />
    </svg>
  </span>;

Icon.defaultProps = {
  size: 32,
  useOwnColor: false,
  inline: false,
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  useOwnColor: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  inline: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
};

export default withFunctionalClassName(WP_COMPONENT_DEF, ['inline', 'useOwnColor'])(Icon);
