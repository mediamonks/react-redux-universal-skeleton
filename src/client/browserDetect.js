/* eslint-disable no-console, no-param-reassign, no-useless-escape, max-len, space-infix-ops, global-require, comma-spacing */
/**
 * This file should check if the browser is supported and if not, redirect to an appropriate
 * error page. This code will be executed before all other JS, as it is added to the top of
 * the exported JS bundle.
 */
const Browser = (() => {
  const document = window.document;

  function parse(userAgent, platform) {
    const ua = userAgent.toLowerCase();
    platform = platform ? platform.toLowerCase() : '';
    let platformVersion = '';

    const UAArr = ua.match(
      /(opera|ie|firefox|chrome|trident|crios|version)[\s\/:]([\w\d\.]+)?.*?(safari|(?:rv[\s\/:]|version[\s\/:])([\w\d\.]+)|$)/,
    ) || [null, 'unknown', 0];

    if (UAArr[1] === 'trident') {
      UAArr[1] = 'ie';
      if (UAArr[4]) {
        UAArr[2] = UAArr[4];
      }
    } else if (UAArr[1] === 'crios') {
      UAArr[1] = 'chrome';
    }

    platform = ua.match(/ip(?:ad|od|hone)/)
      ? 'ios'
      : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['other'])[0];
    if (platform === 'win') {
      platform = 'windows';
    } else if (platform === 'ios') {
      const iOSVersion = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
      platformVersion = parseInt(iOSVersion[1], 10);
    }

    return {
      userAgent,
      platform,
      platformVersion,
      name: UAArr[1] === 'version' ? UAArr[3] : UAArr[1],
      version: parseFloat(UAArr[1] === 'opera' && UAArr[4] ? UAArr[4] : UAArr[2]),
      isWebview:
        ua.indexOf('fb4a') !== -1 ||
        ua.indexOf('fbav') !== -1 || // FB
        ua.indexOf('pinterest') !== -1 ||
        ua.indexOf('instagram ') !== -1,
    };
  }

  const browser = parse(navigator.userAgent, navigator.platform);
  browser.isMobile =
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
      navigator.userAgent,
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      navigator.userAgent.substr(0, 4),
    );

  // ie11 fix
  if (
    browser.name !== 'firefox' &&
    browser.name !== 'chrome' &&
    browser.name !== 'safari' &&
    !window.ActiveXObject &&
    browser.name !== 'ie'
  ) {
    browser.name = 'ie';
    browser.version = 11;
  }

  if (browser.name === 'ie') {
    browser.version = document.documentMode;
  }

  browser[browser.name] = true;
  browser[browser.name + browser.version] = true;
  browser[browser.platform] = true;
  browser[browser.platformVersion] = true;

  return browser;
})();

const appNode = document.getElementById('app');

function showPage(template) {
  appNode.parentNode.removeChild(appNode);
  document.write(template);
}

if (Browser.ie && Browser.version < 11) {
  const template = require('raw-loader!./browser-not-supported.html');

  showPage(template);
} else if (Browser.platform === 'ios' && Browser.platformVersion < 9) {
  const template = require('raw-loader!./ios-not-supported.html');

  showPage(template);
} else if (Browser.android && Browser.isMobile && !Browser.chrome && !Browser.isWebview) {
  const template = require('raw-loader!./browser-not-supported-mobile.html');

  showPage(template);
}
