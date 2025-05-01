import ViewUtil from './view-util.js';
import Util from './util.js';
import Service from './service.js';
import Commands from './commands.js';
import ToastView from './toast-view.js';

class AuthMetadataView {
  $el = $('#authMetadataView');
  $closeButton = this.$el.find('.closeButton');
  $content = this.$el.find('.view-content');
  $configSelect = $('#authConfigurationSelect');

  constructor() {
    console.log('AuthMetadataView initialized, $el:', this.$el.length);
    this.$closeButton.on('click', () => {
      console.log('Close button clicked');
      this.hide();
    });

    this.$configSelect.on('change', () => {
      const configName = this.$configSelect.val();
      if (configName) {
        console.log('Loading configuration:', configName);
        Service.queueCommandFront(Commands.configurationLoad(configName), (data) => {
          console.log('Configuration load response:', data);
          if (data.error) {
            ToastView.show(`Error loading configuration: ${data.error}`);
          } else if (data.ConfigurationLoad?.['@_result'] === 'OK') {
            ToastView.show(`Configuration loaded: ${configName}`);
            // Refresh the current configuration after loading
            this.getCurrentConfiguration();
          } else {
            ToastView.show(`Error loading configuration: Unexpected response`);
          }
        });
      }
    });

    // Load configurations when view is shown
    this.$el.on('show', () => {
      this.loadConfigurations();
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
    this.loadConfigurations();
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

  loadConfigurations() {
    Service.queueCommandFront(Commands.configurationList(), (data) => {
      if (data.error) {
        console.error('Error loading configurations:', data.error);
        ToastView.show(`Error loading configurations: ${data.error}`);
        return;
      }

      console.log('Configuration list response:', data);
      const configs = data.ConfigurationList?.ConfigurationItem || [];
      this.$configSelect.empty();
      
      if (Array.isArray(configs)) {
        configs.forEach(config => {
          this.$configSelect.append(`<option value="${config['@_name']}">${config['@_name']}</option>`);
        });
      } else if (configs && configs['@_name']) {
        this.$configSelect.append(`<option value="${configs['@_name']}">${configs['@_name']}</option>`);
      }

      // Get current configuration
      this.getCurrentConfiguration();
    });
  }

  getCurrentConfiguration() {
    Service.queueCommandFront(Commands.configurationGet(), (data) => {
      console.log('Current configuration response:', data);
      if (data.error) {
        console.error('Error getting current configuration:', data.error);
        return;
      }
      const currentConfig = data.ConfigurationGet?.Configuration;
      if (currentConfig) {
        console.log('Setting current configuration to:', currentConfig);
        this.$configSelect.val(currentConfig);
      }
    });
  }
}

export default new AuthMetadataView(); 