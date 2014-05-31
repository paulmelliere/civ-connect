var service = new (require('./api-service').Service)();

service.init();
service.run(10080);