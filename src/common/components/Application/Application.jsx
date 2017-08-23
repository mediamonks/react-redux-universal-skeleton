/* global WP_DEFINE_IS_NODE */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import shouldUpdateScroll from 'src/common/util/shouldUpdateScroll';
import ScrollBehaviorContext from 'react-router-scroll/lib/ScrollBehaviorContext';
import DeviceStateProvider from 'src/common/components/DeviceStateProvider';
import 'src/common/style/screen.scss';
import GeneralError from 'src/common/components/GeneralError';

import ScrollManager from '../ScrollManager';

/**
 * The root component of the application.
 */
class Application extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mouseMode: false,
    };
  }

  componentDidMount() {
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleMouseDown = () => {
    this.setState({ mouseMode: true });
  };

  handleKeyDown = () => {
    this.setState({ mouseMode: false });
  };

  render() {
    const { children, hasGeneralError } = this.props;
    const { mouseMode } = this.state;

    const content = (
      <DeviceStateProvider>
        <div className={`component-application ${mouseMode ? 'mode-mouse' : ''}`}>
          <ScrollManager />
          {hasGeneralError ? <GeneralError /> : children}
        </div>
      </DeviceStateProvider>
    );

    return WP_DEFINE_IS_NODE
      ? content
      : <ScrollBehaviorContext routerProps={this.props} shouldUpdateScroll={shouldUpdateScroll}>
          {content}
        </ScrollBehaviorContext>;
  }
}

Application.defaultProps = {
  hasGeneralError: false,
};

Application.propTypes = {
  /*
   * Provide a true or false depending on the current page
   */
  children: PropTypes.node.isRequired,
  /*
   * Provide a true or false depending on the current page
   */
  hasGeneralError: PropTypes.bool,
};

export default Application;
