var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class DIContainerTemplate {
    constructor(serviceConfigs, singelton) {
        // create service configs map
        this.serviceConfigs = new Map();
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
    addSingelton(name, create, dispose) {
        // if singelton is defined, add service to singelton container
        if (this.singelton) {
            this.singelton.addSingelton(name, create, dispose);
        }
        else {
            // add service to service configs map (this container is singelton container by itself)
            this.serviceConfigs.set(name, { create, type: "singelton", dispose });
        }
    }
    addScoped(name, create, dispose) {
        // if this container is singelton by itself, throw error
        if (!this.singelton) {
            throw new Error("Can not add scoped service to singelton contaioner");
        }
        // add service to service configs map
        this.serviceConfigs.set(name, { create, type: "scoped", dispose });
    }
    addTransient(name, create, dispose) {
        // if this container is singelton by itself, throw error
        if (!this.singelton) {
            throw new Error("Can not add transient service to singelton contaioner");
        }
        // add service to service configs map
        this.serviceConfigs.set(name, { create, type: "transient", dispose });
    }
    createContainer() {
        return new DIContainer(this.serviceConfigs, this.singelton);
    }
}
class DIContainer extends DIContainerTemplate {
    constructor(serviceConfigs, singelton) {
        super(serviceConfigs, singelton);
        this.services = [];
    }
    get(name) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // get service config
            const serviceConfig = this.serviceConfigs.get(name);
            // if service config does not exist or is singelton and this container is not the singelton container, return the singelton container's service
            if ((!serviceConfig || serviceConfig.type === "singelton") &&
                this.singelton) {
                return this.singelton.get(name);
            }
            // check if service config exists
            if (!serviceConfig) {
                throw new Error(`Service ${name} not registered`);
            }
            let service;
            // try to get service from services map if it is not transient
            if (serviceConfig.type !== "transient") {
                service = (_a = this.services.find((service) => service.name === name)) === null || _a === void 0 ? void 0 : _a.instance;
                // if service is found, return it
                if (service) {
                    return service;
                }
            }
            // if service is not found, create it
            service = yield serviceConfig.create(this);
            // save service to services map
            this.services.push({ name, instance: service });
            // return service
            return service;
        });
    }
    dispose() {
        return __awaiter(this, arguments, void 0, function* (disposeSingelton = false) {
            const disposedServices = [];
            for (let service of this.services) {
                // get service config
                const serviceConfig = this.serviceConfigs.get(service.name);
                // dispose service
                if (serviceConfig.dispose) {
                    yield serviceConfig.dispose(service.instance);
                    disposedServices.push(service.name);
                }
            }
            // clear services map
            this.services = [];
            // clear service configs map
            this.serviceConfigs.clear();
            // if disposeSingelton is true, dispose the singelton container
            if (disposeSingelton && this.singelton) {
                disposedServices.push(...(yield this.singelton.dispose(true)));
            }
            // return disposed services names
            return disposedServices;
        });
    }
}
export default DIContainerTemplate;
//# sourceMappingURL=index.js.map