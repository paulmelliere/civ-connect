var service = new (require('./app').Service)();

service.init();
service.run(process.env.PORT || 5000);