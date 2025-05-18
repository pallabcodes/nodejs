import { EventEmitter } from 'events';

const createServiceRegistry = () => {
  const services = new Map();
  const events = new EventEmitter();
  
  const register = (serviceName, serviceInstance) => {
    if (services.has(serviceName)) {
      throw new Error(`Service ${serviceName} is already registered`);
    }
    services.set(serviceName, serviceInstance);
    events.emit('service:registered', { serviceName, serviceInstance });
    return serviceInstance;
  };

  const unregister = (serviceName) => {
    if (!services.has(serviceName)) {
      throw new Error(`Service ${serviceName} is not registered`);
    }
    const service = services.get(serviceName);
    services.delete(serviceName);
    events.emit('service:unregistered', { serviceName, service });
    return service;
  };

  const get = (serviceName) => {
    if (!services.has(serviceName)) {
      throw new Error(`Service ${serviceName} is not registered`);
    }
    return services.get(serviceName);
  };

  const has = (serviceName) => services.has(serviceName);

  const list = () => Array.from(services.keys());

  const clear = () => {
    services.clear();
    events.emit('services:cleared');
  };

  return {
    register,
    unregister,
    get,
    has,
    list,
    clear,
    events
  };
};

// Singleton instance
const serviceRegistry = createServiceRegistry();

export { serviceRegistry as ServiceRegistry }; 