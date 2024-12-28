type DIServiceConfig<T> = {
    type: "singelton" | "scoped" | "transient";
    create: (container: DIContainer) => Promise<T>;
    dispose?: (instance: T) => Promise<void>;
};
declare class DIContainer {
    private singelton?;
    private serviceConfigs;
    private services;
    constructor(serviceConfigs?: Map<string, DIServiceConfig<any>>, singelton?: DIContainer | true);
    addSingelton<T>(name: string, create: (container: DIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>): void;
    addScoped<T>(name: string, create: (container: DIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>): void;
    addTransient<T>(name: string, create: (container: DIContainer) => Promise<T>, dispose?: (instance: T) => Promise<void>): void;
    createContainer(): DIContainer;
    get<T>(name: string): Promise<T>;
    dispose(disposeSingelton?: boolean): Promise<string[]>;
}
export default DIContainer;
//# sourceMappingURL=index.d.ts.map