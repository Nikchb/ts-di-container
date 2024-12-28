"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class DIContainer {
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
        // create services map
        this.services = new Map();
    }
    addSingelton(name, create, dispose) {
        // if singelton is defined, add service to singelton container
        if (this.singelton) {
            this.singelton.addSingelton(name, create, dispose);
        }
        else {
            // add service to service configs map (this container is singelton container by itself)
            this.serviceConfigs.set(name, { create, type: 'singelton', dispose });
        }
    }
    addScoped(name, create, dispose) {
        // if this container is singelton by itself, throw error
        if (!this.singelton) {
            throw new Error("Can not add scoped service to singelton contaioner");
        }
        // add service to service configs map
        this.serviceConfigs.set(name, { create, type: 'scoped', dispose });
    }
    addTransient(name, create, dispose) {
        // if this container is singelton by itself, throw error
        if (!this.singelton) {
            throw new Error("Can not add transient service to singelton contaioner");
        }
        // add service to service configs map
        this.serviceConfigs.set(name, { create, type: 'transient', dispose });
    }
    createContainer() {
        return new DIContainer(this.serviceConfigs, this.singelton);
    }
    get(name) {
        return __awaiter(this, void 0, void 0, function* () {
            // get service config
            const serviceConfig = this.serviceConfigs.get(name);
            // check if service config exists
            if (!serviceConfig) {
                throw new Error(`Service ${name} not registered`);
            }
            // if service config is singelton and this is not the singelton container, return the singelton container's service
            if (serviceConfig.type === 'singelton' && this.singelton) {
                return this.singelton.get(name);
            }
            let service;
            // try to get service from services map if it is not transient
            if (serviceConfig.type !== 'transient') {
                service = this.services.get(name);
                // if service is found, return it
                if (service) {
                    return service;
                }
            }
            // if service is not found, create it
            service = yield serviceConfig.create(this);
            // save service to services map
            this.services.set(serviceConfig.type !== 'transient' ? name : (0, uuid_1.v4)(), service);
            // return service
            return service;
        });
    }
    dispose() {
        this.services.forEach((service, name) => __awaiter(this, void 0, void 0, function* () {
            // get service config
            const serviceConfig = this.serviceConfigs.get(name);
            // dispose service
            if (serviceConfig.dispose) {
                yield serviceConfig.dispose(service);
            }
        }));
        // clear services map
        this.services.clear();
        // clear service configs map
        this.serviceConfigs.clear();
    }
}
exports.default = DIContainer;
//# sourceMappingURL=index.js.map