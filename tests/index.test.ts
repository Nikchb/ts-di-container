import DIContainerTemplate from "ts-di-container";
import { describe, it, test, expect } from "vitest";

class ClassA {
  constructor() {}
  toString() {
    return "ClassA";
  }
  dispose() {
    console.log("ClassA disposed");
  }
}

class ClassB {
  constructor(private readonly classA: ClassA) {}
  toString() {
    return "ClassB";
  }
  dispose() {
    console.log("ClassB disposed");
  }
}

class ClassC {
  constructor(
    private readonly classA: ClassA,
    private readonly classB: ClassB
  ) {}
  toString() {
    return "ClassC";
  }
  dispose() {
    console.log("ClassC disposed");
  }
}

describe("DIContainer tests", () => {
  it("Create empty container template", () => {
    const containerTemplate = new DIContainerTemplate();
    expect(containerTemplate).toBeDefined();
  });

  it("Register singleton service and dispose container", async () => {
    // create container
    const containerTemplate = new DIContainerTemplate();
    // register singleton service
    containerTemplate.addSingelton<ClassA>(
      "ClassA",
      async () => new ClassA(),
      async (instance) => instance.dispose()
    );
    // construct container
    const container = containerTemplate.createContainer();
    // get singleton service
    const classA = await container.get<ClassA>("ClassA");
    // expect ClassA to be instance of ClassA
    expect(classA).toBeInstanceOf(ClassA);
    // dispose container without disposing singletons
    const disposedServices = await container.dispose();
    // expect ClassA not to be disposed
    expect(disposedServices.length).toBe(0);
  });

  it("Register singleton service and get it from another container and dispose", async () => {
    // create container
    const containerTemplate = new DIContainerTemplate();
    // register singleton service
    containerTemplate.addSingelton<ClassA>(
      "ClassA",
      async () => new ClassA(),
      async (instance) => instance.dispose()
    );
    // create container
    const container1 = containerTemplate.createContainer();
    // create another container
    const container2 = containerTemplate.createContainer();
    // get singleton service from container
    const classA1 = await container1.get<ClassA>("ClassA");
    // get singleton service from container
    const classA2 = await container1.get<ClassA>("ClassA");
    // expect ClassA1 to be instance of ClassA
    expect(classA1).toBeInstanceOf(ClassA);
    // expect ClassA2 to be instance of ClassA
    expect(classA2).toBeInstanceOf(ClassA);
    // expect ClassA1 and ClassA2 to be the same instance
    expect(classA1).toBe(classA2);
    // dispose container1 with disposing singletons
    const disposedServices1 = await container1.dispose(true);
    // dispose container2 with disposing singletons
    const disposedServices2 = await container2.dispose(true);
    // expect ClassA to be disposed
    expect(disposedServices1).includes("ClassA");
    expect(disposedServices1.length).toBe(1);
    // expect ClassA not to be disposed as it is already disposed by call from container1
    expect(disposedServices2.length).toBe(0);
  });

  it("Register scoped service and dispose container", async () => {
    // create container template
    const containerTemplate = new DIContainerTemplate();
    // register scoped service
    containerTemplate.addScoped<ClassA>(
      "ClassA",
      async () => new ClassA(),
      async (instance) => instance.dispose()
    );
    // construct container
    const container = containerTemplate.createContainer();
    // get scoped service from container
    const classA1 = await container.get<ClassA>("ClassA");
    // get scoped service from container
    const classA2 = await container.get<ClassA>("ClassA");
    // expect ClassA1 to be instance of ClassA
    expect(classA1).toBeInstanceOf(ClassA);
    // expect ClassA2 to be instance of ClassA
    expect(classA2).toBeInstanceOf(ClassA);
    // expect ClassA1 and ClassA2 to be the same instance
    expect(classA1).toBe(classA2);
    // dispose container
    const disposedServices = await container.dispose();
    // expect ClassA to be disposed
    expect(disposedServices).includes("ClassA");
    expect(disposedServices.length).toBe(1);
  });

  it("Register transient service and dispose container", async () => {
    // create container template
    const containerTemplate = new DIContainerTemplate();
    // register transient service
    containerTemplate.addTransient<ClassA>(
      "ClassA",
      async () => new ClassA(),
      async (instance) => instance.dispose()
    );
    // construct container
    const container = containerTemplate.createContainer();
    // get transient service from container
    const classA1 = await container.get<ClassA>("ClassA");
    // get transient service from container
    const classA2 = await container.get<ClassA>("ClassA");
    // expect ClassA1 to be instance of ClassA
    expect(classA1).toBeInstanceOf(ClassA);
    // expect ClassA2 to be instance of ClassA
    expect(classA2).toBeInstanceOf(ClassA);
    // expect ClassA1 and ClassA2 to be different instances
    expect(classA1).not.toBe(classA2);
    // dispose container
    const disposedServices = await container.dispose();
    // expect ClassA to be disposed 2 times
    expect(disposedServices.filter((v) => v == "ClassA").length).toBe(2);
  });

  it("Register all services types and dispose container", async () => {
    // create container template
    const containerTemplate = new DIContainerTemplate();
    // register singleton service
    containerTemplate.addSingelton<ClassA>(
      "ClassA",
      async () => new ClassA(),
      async (instance) => instance.dispose()
    );
    // register scoped service
    containerTemplate.addScoped<ClassB>(
      "ClassB",
      async (container) => new ClassB(await container.get<ClassA>("ClassA")),
      async (instance) => instance.dispose()
    );
    // register transient service
    containerTemplate.addTransient<ClassC>(
      "ClassC",
      async (container) =>
        new ClassC(
          await container.get<ClassA>("ClassA"),
          await container.get<ClassB>("ClassB")
        ),
      async (instance) => instance.dispose()
    );
    // construct container
    const container = containerTemplate.createContainer();
    // get ClassC
    await container.get<ClassC>("ClassC");
    // dispose container
    const disposedServices = await container.dispose();
    // expect ClassB and ClassC to be disposed
    expect(disposedServices).includes("ClassB");
    expect(disposedServices).includes("ClassC");
  });

  it("Register all services types and dispose container with singelton", async () => {
    // create container template
    const containerTemplate = new DIContainerTemplate();
    // register singleton service
    containerTemplate.addSingelton<ClassA>(
      "ClassA",
      async () => new ClassA(),
      async (instance) => instance.dispose()
    );
    // register scoped service
    containerTemplate.addScoped<ClassB>(
      "ClassB",
      async (container) => new ClassB(await container.get<ClassA>("ClassA")),
      async (instance) => instance.dispose()
    );
    // register transient service
    containerTemplate.addTransient<ClassC>(
      "ClassC",
      async (container) =>
        new ClassC(
          await container.get<ClassA>("ClassA"),
          await container.get<ClassB>("ClassB")
        ),
      async (instance) => instance.dispose()
    );
    // construct container
    const container = containerTemplate.createContainer();
    // get ClassC
    await container.get<ClassC>("ClassC");
    // dispose container
    const disposedServices = await container.dispose(true);
    // expect ClassA, ClassB and ClassC to be disposed
    expect(disposedServices).includes("ClassA");
    expect(disposedServices).includes("ClassB");
    expect(disposedServices).includes("ClassC");
  });
});
