type DIServiceConfig<T> = {
    type: "singelton" | "scoped" | "transient";
    create: (container: IDIContainer) => Promise<T>;
    dispose?: (instance: T) => Promise<void>;
};
export interface IDIContainer {
    get<T>(name: string): Promise<T>;
    dispose(disposeSingelton?: boolean): Promise<string[]>;
}
declare class DIContainerTemplate {
    protected singelton?: DIContainer;
    protected serviceConfigs: Map<string, DIServiceConfig<any>>;
    constructor(serviceConfigs?: Map<string, DIServiceConfig<any>>, singelton?: DIContainer | true);
    addSingelton<T>(name: string, create: (container: IDIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>): void;
    addScoped<T>(name: string, create: (container: IDIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>): void;
    addTransient<T>(name: string, create: (container: IDIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>): void;
    createContainer(): IDIContainer;
}
declare class DIContainer extends DIContainerTemplate implements IDIContainer {
    private services;
    constructor(serviceConfigs?: Map<string, DIServiceConfig<any>>, singelton?: DIContainer | true);
    get<T>(name: string): Promise<T>;
    dispose(disposeSingelton?: boolean): Promise<string[]>;
}
export default DIContainerTemplate;
//# sourceMappingURL=index.d.ts.map