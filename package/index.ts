import { v4 as uuidv4 } from 'uuid';

type DIServiceConfig<T> = {
  type: 'singelton' | 'scoped' | 'transient';
  create: (container: DIContainer) => Promise<T>;
  dispose?: (instance: T) => Promise<void>;
}

class DIContainer {
  private singelton?: DIContainer; // underfined if this it is singelton container by itself

  private serviceConfigs: Map<string, DIServiceConfig<any>>;

  private services: Map<string, any>;

  constructor(serviceConfigs?: Map<string, DIServiceConfig<any>>, singelton?: DIContainer | true) {
    // create service configs map
    this.serviceConfigs = new Map<string, DIServiceConfig<any>>();
    // add service configs to map
    if (serviceConfigs) {
      serviceConfigs.forEach((serviceConfig, name) => {
        this.serviceConfigs.set(name, serviceConfig);
      });
    }
    // if singelton parameter is defined, set it
    if (singelton && singelton !== true) {
      this.singelton = singelton;
    }
    // if singelton parameter is not defined, create a new singelton container
    if (!singelton) {
      this.singelton = new DIContainer(serviceConfigs, true);
    }
    // create services map
    this.services = new Map<string, any>();
  }

  public addSingelton<T>(name: string, create: (container: DIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>) {
    // if singelton is defined, add service to singelton container
    if (this.singelton) {
      this.singelton.addSingelton(name, create, dispose);
    } else {
      // add service to service configs map (this container is singelton container by itself)
      this.serviceConfigs.set(name, { create, type: 'singelton', dispose });
    }
  }

  public addScoped<T>(name: string, create: (container: DIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>) {
    // if this container is singelton by itself, throw error
    if (!this.singelton) {
      throw new Error("Can not add scoped service to singelton contaioner")
    }
    // add service to service configs map
    this.serviceConfigs.set(name, { create, type: 'scoped', dispose });
  }

  public addTransient<T>(name: string, create: (container: DIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>) {
    // if this container is singelton by itself, throw error
    if (!this.singelton) {
      throw new Error("Can not add transient service to singelton contaioner")
    }
    // add service to service configs map
    this.serviceConfigs.set(name, { create, type: 'transient', dispose });
  }

  public createContainer(): DIContainer {
    return new DIContainer(this.serviceConfigs, this.singelton);
  }

  public async get<T>(name: string): Promise<T> {
    // get service config
    const serviceConfig = this.serviceConfigs.get(name) as DIServiceConfig<T>;
    // check if service config exists
    if (!serviceConfig) {
      throw new Error(`Service ${name} not registered`);
    }
    // if service config is singelton and this is not the singelton container, return the singelton container's service
    if (serviceConfig.type === 'singelton' && this.singelton) {
      return this.singelton.get<T>(name);
    }
    let service: T;
    // try to get service from services map if it is not transient
    if (serviceConfig.type !== 'transient') {
      service = this.services.get(name) as T;
      // if service is found, return it
      if (service) {
        return service;
      }
    }
    // if service is not found, create it
    service = await serviceConfig.create(this);
    // save service to services map
    this.services.set(serviceConfig.type !== 'transient' ? name : uuidv4(), service);
    // return service
    return service;
  }

  public dispose() {
    this.services.forEach(async (service, name) => {
      // get service config
      const serviceConfig = this.serviceConfigs.get(name) as DIServiceConfig<any>;
      // dispose service
      if (serviceConfig.dispose) {
        await serviceConfig.dispose(service);
      }
    });
    // clear services map
    this.services.clear();
    // clear service configs map
    this.serviceConfigs.clear();
  }
}

export default DIContainer;