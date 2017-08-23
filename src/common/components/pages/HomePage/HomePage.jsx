import React, { PureComponent } from 'react';
import { componentClassNameProp } from 'src/common/util/componentClassNameUtils';
import withDeviceState from 'src/common/util/device-state/withDeviceState';
import './home-page.scss';

class HomePage extends PureComponent {
  state = {};

  render() {
    return (
      <div {...componentClassNameProp(this)}>
        <p>HomePage</p>
      </div>
    );
  }
}

HomePage.propTypes = {};

export default withDeviceState()(HomePage);
