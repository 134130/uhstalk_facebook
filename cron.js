const cron = require('node-cron');
cron.schedule('*/20 1,14-24 * * *', function() {
	console.log('node-cron');
	http.get("http://agile-castle-50630.herokuapp.com/");
});
