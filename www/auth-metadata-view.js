import ViewUtil from './view-util.js';
import Util from './util.js';

class AuthMetadataView {
  $el = $('#authMetadataView');
  $closeButton = this.$el.find('#authMetadataCloseButton');
  $content = this.$el.find('#authMetadataContent');

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
    const html = `
      <div class="auth-metadata-section">
        <h3>Connection Status</h3>
        <p>Connected: ${authState.isConnected ? 'Yes' : 'No'}</p>
        <p>Last Check: ${authState.lastCheck || 'Never'}</p>
      </div>
      <div class="auth-metadata-section">
        <h3>Session Info</h3>
        <p>Session ID: ${authState.sessionId || 'None'}</p>
        <p>HQPlayer Version: ${authState.hqpVersion || 'Unknown'}</p>
      </div>
    `;
    this.$content.html(html);
  }
}

export default new AuthMetadataView(); 