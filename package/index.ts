type DIServiceConfig<T> = {
  type: "singelton" | "scoped" | "transient";
  create: (container: IDIContainer) => Promise<T>;
  dispose?: (instance: T) => Promise<void>;
};

export interface IDIContainer {
  get<T>(name: string): Promise<T>;
  dispose(disposeSingelton?: boolean): Promise<string[]>;
}

class DIContainerTemplate {
  protected singelton?: DIContainer; // underfined if this it is singelton container by itself

  protected serviceConfigs: Map<string, DIServiceConfig<any>>;

  constructor(
    serviceConfigs?: Map<string, DIServiceConfig<any>>,
    singelton?: DIContainer | true
  ) {
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
  }

  public addSingelton<T>(
    name: string,
    create: (container: IDIContainer) => Promise<T>,
    dispose?: (instance: T) => Promise<void>
  ) {
    // if singelton is defined, add service to singelton container
    if (this.singelton) {
      this.singelton.addSingelton(name, create, dispose);
    } else {
      // add service to service configs map (this container is singelton container by itself)
      this.serviceConfigs.set(name, { create, type: "singelton", dispose });
    }
  }

  public addScoped<T>(
    name: string,
    create: (container: IDIContainer) => Promise<T>,
    dispose?: (instance: T) => Promise<void>
  ) {
    // if this container is singelton by itself, throw error
    if (!this.singelton) {
      throw new Error("Can not add scoped service to singelton contaioner");
    }
    // add service to service configs map
    this.serviceConfigs.set(name, { create, type: "scoped", dispose });
  }

  public addTransient<T>(
    name: string,
    create: (container: IDIContainer) => Promise<T>,
    dispose?: (instance: T) => Promise<void>
  ) {
    // if this container is singelton by itself, throw error
    if (!this.singelton) {
      throw new Error("Can not add transient service to singelton contaioner");
    }
    // add service to service configs map
    this.serviceConfigs.set(name, { create, type: "transient", dispose });
  }

  public createContainer(): IDIContainer {
    return new DIContainer(this.serviceConfigs, this.singelton) as IDIContainer;
  }
}

class DIContainer extends DIContainerTemplate implements IDIContainer {
  private services: { name: string; instance: any }[];

  constructor(
    serviceConfigs?: Map<string, DIServiceConfig<any>>,
    singelton?: DIContainer | true
  ) {
    super(serviceConfigs, singelton);
    this.services = [];
  }

  public async get<T>(name: string): Promise<T> {
    // get service config
    const serviceConfig = this.serviceConfigs.get(name) as DIServiceConfig<T>;
    // if service config does not exist or is singelton and this container is not the singelton container, return the singelton container's service
    if (
      (!serviceConfig || serviceConfig.type === "singelton") &&
      this.singelton
    ) {
      return this.singelton.get<T>(name);
    }
    // check if service config exists
    if (!serviceConfig) {
      throw new Error(`Service ${name} not registered`);
    }
    let service: T;
    // try to get service from services map if it is not transient
    if (serviceConfig.type !== "transient") {
      service = this.services.find((service) => service.name === name)
        ?.instance as T;
      // if service is found, return it
      if (service) {
        return service;
      }
    }
    // if service is not found, create it
    service = await serviceConfig.create(this);
    // save service to services map
    this.services.push({ name, instance: service });
    // return service
    return service;
  }

  public async dispose(disposeSingelton: boolean = false): Promise<string[]> {
    const disposedServices: string[] = [];
    for (let service of this.services) {
      // get service config
      const serviceConfig = this.serviceConfigs.get(
        service.name
      ) as DIServiceConfig<any>;
      // dispose service
      if (serviceConfig.dispose) {
        await serviceConfig.dispose(service.instance);
        disposedServices.push(service.name);
      }
    }
    // clear services map
    this.services = [];
    // clear service configs map
    this.serviceConfigs.clear();
    // if disposeSingelton is true, dispose the singelton container
    if (disposeSingelton && this.singelton) {
      disposedServices.push(...(await this.singelton.dispose(true)));
    }
    // return disposed services names
    return disposedServices;
  }
}

export default DIContainerTemplate;
