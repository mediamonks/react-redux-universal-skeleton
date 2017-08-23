import React from 'react';

class InputRange extends React.Component {
  constructor(props) {
    super(props);

    // copied over from the usa, this will break on the server rendering
    // this.isIE = (navigator.appName == 'Microsoft Internet Explorer' ||
    // !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv 11/)))

    this.isIE = false;
  }
  rangeMouseMove = e => {
    this.props.onMouseMove && this.props.onMouseMove(e);

    if (this.isIE && (e.buttons === 1 || e.which === 1)) {
      this.props.onChange && this.props.onChange(e);
    }
  };

  rangeChange = e => {
    this.props.onChange && this.props.onChange(e);
  };

  rangeClick = e => {
    const { onClick, onChange } = this.props;

    onClick && onClick(e) && onChange && onChange(e);
  };

  rangeKeyDown = e => {
    this.props.onKeyDown && this.props.onKeyDown(e);
    this.props.onChange && this.props.onChange(e);
  };

  rangeTouch = e => {
    this.props.onTouchEnd && this.props.onTouchEnd(e);
    this.props.onChange && this.props.onChange(e);
  };

  rangeTouchMove = e => {
    this.props.onTouchMove && this.props.onTouchMove(e);
    this.props.onChange && this.props.onChange(e);
  };

  render() {
    const {
      value, // eslint-disable-line no-unused-vars, react/prop-types
      ...extraProps
    } = this.props;

    const props = {
      ...extraProps,
      onClick: this.rangeClick,
      onKeyDown: this.rangeKeyDown,
      onMouseMove: this.rangeMouseMove,
      onTouchEnd: this.rangeTouch,
      onTouchMove: this.rangeTouchMove,
      onChange: this.rangeChange,
      onInput: this.rangeChange,
    };

    return <input {...props} type="range" />;
  }
}

InputRange.defaultProps = {
  onChange: null,
  onClick: null,
  onKeyDown: null,
  onMouseMove: null,
  onTouchEnd: null,
  onTouchMove: null,
};

InputRange.propTypes = {
  onChange: React.PropTypes.func,
  onClick: React.PropTypes.func,
  onKeyDown: React.PropTypes.func,
  onMouseMove: React.PropTypes.func,
  onTouchEnd: React.PropTypes.func,
  onTouchMove: React.PropTypes.func,
};

export default InputRange;
