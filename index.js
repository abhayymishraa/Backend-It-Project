const express = require('express');
const newrelic = require('newrelic'); // New Relic is required to send events
const promClient = require('prom-client'); // Prometheus client

let data = [];
const app = express();
app.use(express.json());

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Custom Counter
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

const lpgConcentration = new promClient.Gauge({
    name: 'iot_lpg_concentration',
    help: 'LPG gas concentration from MQ5 sensor'
});
const coConcentration = new promClient.Gauge({
    name: 'iot_co_concentration',
    help: 'CO gas concentration from MQ5 sensor'
});
const ch4Concentration = new promClient.Gauge({
    name: 'iot_ch4_concentration',
    help: 'CH4 gas concentration from MQ5 sensor'
});
const propaneConcentration = new promClient.Gauge({
    name: 'iot_propane_concentration',
    help: 'Propane gas concentration from MQ5 sensor'
});
// Register the custom metrics
register.registerMetric(temperatureGauge);
register.registerMetric(humidityGauge);
register.registerMetric(mq5Gauge);
register.registerMetric(routeCounter);
register.registerMetric(lpgConcentration);
register.registerMetric(coConcentration);
register.registerMetric(ch4Concentration);
register.registerMetric(propaneConcentration);

// Optional: Add default metrics to Prometheus
promClient.collectDefaultMetrics({ register });

app.use((req, res, next) => {
    const route = req.route ? req.route.path : req.path;
    routeCounter.inc({ method: req.method, route: route });
    next();
});

// Effective RL value calculation
const RL = 319.73; // Calculated parallel resistance of 1k ohm and 470 ohm

// Function to calculate gas concentrations based on MQ-5 sensor readings.
function calculateGasConcentrations(mq5Value) {
    const RO = RL; // Assume RO = RL in clean air as a basic calibration.
    const rs_ro_ratio = mq5Value / RO; // Calculate RS/R0 ratio.

    // Use actual constants derived from the MQ-5 datasheet:
    const lpgConcentration = 1000 * Math.pow(rs_ro_ratio, -2.3);
    const coConcentration = 500 * Math.pow(rs_ro_ratio, -1.7);
    const ch4Concentration = 10000 * Math.pow(rs_ro_ratio, -1.3);
    const propaneConcentration = 1000 * Math.pow(rs_ro_ratio, -2.3);

    return {
        lpg: lpgConcentration.toFixed(2),
        co: coConcentration.toFixed(2),
        ch4: ch4Concentration.toFixed(2),
        propane: propaneConcentration.toFixed(2),
    };
}

app.get('/', (req, res) => {
    console.log(data);
    res.send('Data:<br>' + data.join('<br>'));
});

app.post('/', (req, res) => {
    console.log(req.body);

    const { temperature, humidity, mq5Value } = req.body;

    // Calculate gas concentrations
    const gasConcentrations = calculateGasConcentrations(parseFloat(mq5Value));

    // Send custom event to New Relic
    newrelic.recordCustomEvent('SensorData', {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        latitude: '12.3456',
        longitude: '78.9123',
        temperature: temperature,
        humidity: humidity,
        mq5Value: mq5Value,
        ...gasConcentrations
    });

    // Update Prometheus metrics
    temperatureGauge.set(parseFloat(temperature));
    humidityGauge.set(parseFloat(humidity));
    mq5Gauge.set(parseInt(mq5Value));
    lpgConcentration.set(parseFloat(gasConcentrations.lpg));
    coConcentration.set(parseFloat(gasConcentrations.co));
    ch4Concentration.set(parseFloat(gasConcentrations.ch4));
    propaneConcentration.set(parseFloat(gasConcentrations.propane));

    const d = new Date();
    data.unshift('Data Received - ' + d + "  " + JSON.stringify(req.body) + " Gas Concentrations: " + JSON.stringify(gasConcentrations));
    res.json({ ...req.body, gasConcentrations });
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

app.listen(3001, () => console.log('Project is listening on port 3001'));

