module.exports = {
  apps: [
    {
      name: "project",
      script: "index.js",  // Entry file for your app
      node_args: "-r newrelic", // Load New Relic at startup
      watch: false,  // Enable watch mode
      ignore_watch: ["node_modules", "logs"],
      env: {
        NODE_ENV: "production",
        NEW_RELIC_AI_MONITORING_ENABLED: true,
        NEW_RELIC_CUSTOM_INSIGHTS_EVENTS_MAX_SAMPLES_STORED: "100k",
        NEW_RELIC_SPAN_EVENTS_MAX_SAMPLES_STORED: "10k",
        NEW_RELIC_APP_NAME: "project",
        NEW_RELIC_LICENSE_KEY: "84df224d54b3a46f3b9f4eb7fa87a3cbFFFFNRAL"
      }
    }
  ]
};

