import ViewUtil from './view-util.js';
import Util from './util.js';
import Service from './service.js';
import Commands from './commands.js';
import ToastView from './toast-view.js';
import DataUtil from './data-util.js';

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
    console.log('Loading configurations...');
    Service.queueCommandFront(Commands.configurationList(), (data) => {
      if (!data || data.error) {
        console.error('Failed to load configurations:', data?.error);
        ToastView.show('Failed to load configurations');
        return;
      }

      const configs = DataUtil.getArrayFrom(data, 'ConfigurationList', 'ConfigurationItem');
      console.log('Loaded configurations:', configs);

      const $select = this.$configSelect;
      $select.empty();
      
      // Add default option
      $select.append($('<option>', {
        value: '',
        text: 'Select a configuration...'
      }));

      // Add configuration options
      configs.forEach(config => {
        $select.append($('<option>', {
          value: config['@_name'],
          text: config['@_name']
        }));
      });

      // Get current configuration
      Service.queueCommandFront(Commands.configurationGet(), (currentConfigData) => {
        if (!currentConfigData || currentConfigData.error) {
          console.error('Failed to get current configuration:', currentConfigData?.error);
          return;
        }

        console.log('Current configuration response:', currentConfigData);
        const currentConfig = currentConfigData.ConfigurationGet;
        console.log('Parsed current configuration:', currentConfig);
        
        if (currentConfig && currentConfig['@_value']) {
          const currentConfigName = currentConfig['@_value'];
          console.log('Current configuration name:', currentConfigName);
          console.log('Available options:', $select.find('option').map(function() { return $(this).val(); }).get());
          $select.val(currentConfigName);
          console.log('Selected value after setting:', $select.val());
        }
      });

      // Add event listener for configuration selection
      $select.off('change').on('change', (e) => {
        const selectedConfig = e.target.value;
        if (selectedConfig) {
          this.loadConfiguration(selectedConfig);
        }
      });
    });
  }

  loadConfiguration(configName) {
    console.log('Loading configuration:', configName);
    Service.queueCommandFront(Commands.configurationLoad(configName), (data) => {
      if (!data || data.error) {
        console.error('Failed to load configuration:', data?.error);
        ToastView.show('Failed to load configuration');
        return;
      }
      console.log('Configuration loaded successfully');
      ToastView.show('Configuration loaded successfully');
    });
  }
}
export default new AuthMetadataView(); 