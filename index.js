const express = require('express');
const newrelic = require('newrelic'); // New Relic is required to send events
const promClient = require('prom-client'); // Prometheus client

let data = [];
const app = express();
app.use(express.json());

// Create a Registry which registers the metrics
const register = new promClient.Registry();

//Custom Counter
const routeCounter = new promClient.Counter({ name: 'route_requests_total', help: 'Total requests received per route', labelNames: ['method', 'route'] });


// Define custom metrics
const temperatureGauge = new promClient.Gauge({
  name: 'iot_temperature',
  help: 'Temperature value from IoT devices'
});

const humidityGauge = new promClient.Gauge({
  name: 'iot_humidity',
  help: 'Humidity value from IoT devices'
});

const mq5Gauge = new promClient.Gauge({
  name: 'iot_mq5',
  help: 'MQ5 gas sensor value from IoT devices'
});

// Register the custom metrics
register.registerMetric(temperatureGauge);
register.registerMetric(humidityGauge);
register.registerMetric(mq5Gauge);
register.registerMetric(routeCounter);

// Optional: Add default metrics to Prometheus
promClient.collectDefaultMetrics({ register });

app.use((req, res, next) => {
  routeCounter.inc({ method: req.method, route: req.route ? req.route.path : req.path });
  next();
});

app.get('/', (req, res) => {
  console.log(data);
  res.send('Data:<br>' + data.join('<br>'));
});

app.post('/', (req, res) => {
  console.log(req.body);

  const { temperature, humidity, mq5Value } = req.body;

  // Send custom event to New Relic
  newrelic.recordCustomEvent('SensorData', {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    latitude: '12.3456',
    longitude: '78.9123',
    temperature: temperature,
    humidity: humidity,
    mq5Value: mq5Value
  });

  // Update Prometheus metrics
  temperatureGauge.set(temperature);
  humidityGauge.set(humidity);
  mq5Gauge.set(mq5Value);

  const d = new Date();
  data.unshift('Data Received - ' + d + "  " + JSON.stringify(req.body));
  res.json(req.body);
});

// Expose Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/delete/all', (req, res) => {
  data = [];
  res.send("<div>message : Deleted Data</div>");
});

app.listen(3001, () => console.log('project is listening on port 3001'));
