import Util from './util.js';
import ViewUtil from './view-util.js';
import AuthMetadataView from './auth-metadata-view.js';

/**
 *
 */
class TopBar {

  $el = $("#topBar");
  $appLogo = this.$el.find('#appLogo');
  $appTitle = this.$el.find('#appTitle');
  $topBarButtons = $('#topBarButtons');
  $connectionStatus = $('#connectionStatus');

  constructor() {
    console.log('TopBar initialized, connectionStatus:', this.$connectionStatus.length);
    ViewUtil.setVisible(this.$appTitle, false);
    this.setConnectionStatus(false);
    this.$connectionStatus.on('click', () => {
      console.log('Connection status clicked');
      if (window.app) {
        console.log('App found, authState:', window.app.authState);
        AuthMetadataView.show(window.app.authState);
      } else {
        console.error('App not found');
      }
    });
  }

  get $el() {
  	return this.$el;
  }

  showButtons() {
    ViewUtil.setVisible(this.$appTitle, true);
    ViewUtil.setVisible(this.$topBarButtons, true);
  }

  hideButtons() {
    if (ViewUtil.isDisplayed(this.$appLogo)) {
      ViewUtil.setAnimatedCss(this.$appLogo,
          () => {
            this.$appLogo.css('z-index', 0);
            this.$appLogo.css('opacity', 0)
          },
          () => ViewUtil.setDisplayed(this.$appLogo, false));
    }
    ViewUtil.setVisible(this.$appTitle, false);
    ViewUtil.setVisible(this.$topBarButtons, false);
  }

  // used for settings view
  reshowLogo() {
    if (ViewUtil.isDisplayed(this.$appLogo)) {
      return;
    }
    ViewUtil.setVisible(this.$appTitle, false);
    ViewUtil.setDisplayed(this.$appLogo, true);
    ViewUtil.animateCss(this.$appLogo,
        () => {
          this.$appLogo.css('z-index', 9998);
          this.$appLogo.css('opacity', 0);
        },
        () => this.$appLogo.css('opacity', 1));
  }

  setConnectionStatus(isConnected) {
    if (isConnected) {
      this.$connectionStatus.addClass('isConnected');
    } else {
      this.$connectionStatus.removeClass('isConnected');
    }
  }
}

export default new TopBar();
