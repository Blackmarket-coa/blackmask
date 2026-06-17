source "https://rubygems.org"

# latest fastlane version
gem 'fastlane', '2.228.0'

# abbrev was removed from stdlib in ruby 3.4, needs to be added manually.
gem 'abbrev', '0.1.2'

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
