var service = new (require('./api-service').Service)();

service.init();
service.run(process.env.PORT || 5000);