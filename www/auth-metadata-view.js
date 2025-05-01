import ViewUtil from './view-util.js';
import Util from './util.js';

class AuthMetadataView {
  $el = $('#authMetadataView');
  $closeButton = this.$el.find('.closeButton');
  $content = this.$el.find('.view-content');

  constructor() {
    console.log('AuthMetadataView initialized, $el:', this.$el.length);
    this.$closeButton.on('click', () => {
      console.log('Close button clicked');
      this.hide();
    });
  }

  show(authState) {
    console.log('Showing auth metadata view with state:', authState);
    if (!authState) {
      console.error('No auth state provided');
      return;
    }
    ViewUtil.setVisible(this.$el, true);
    this.updateContent(authState);
    console.log('View visibility after show:', this.$el.is(':visible'));
  }

  hide() {
    console.log('Hiding auth metadata view');
    ViewUtil.setVisible(this.$el, false);
  }

  updateContent(authState) {
    $('#authConnectionStatus').text(authState.isConnected ? 'Connected' : 'Not connected');
    $('#authLastCheck').text(authState.lastCheck || 'Never');
    $('#authSessionId').text(authState.sessionId || 'None');
    $('#authHqpVersion').text(authState.hqpVersion || 'Unknown');
  }
}

export default new AuthMetadataView(); 