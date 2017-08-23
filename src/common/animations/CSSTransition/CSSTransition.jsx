import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import './css-transition.scss';

const CSSTransition = ({ children, animationType }) =>
  <ReactCSSTransitionGroup
    transitionName={`${animationType}-animation`}
    transitionEnterTimeout={500}
    transitionLeaveTimeout={500}
    component="div"
    className={`${animationType}-animation`}
  >
    {children}
  </ReactCSSTransitionGroup>;

CSSTransition.defaultProps = {
  children: null,
  animationType: '',
};

CSSTransition.propTypes = {
  children: PropTypes.node,
  animationType: PropTypes.string,
};
export default CSSTransition;
