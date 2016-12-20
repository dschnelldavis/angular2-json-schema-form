interface NodeRequireFunction {
  (id: string): any;
}

interface NodeRequire extends NodeRequireFunction {
  cache: any;
  extensions: any;
  main: NodeModule;
  resolve(id: string): string;
}

declare var require: NodeRequire;

interface NodeModule {
  exports: any;
  require: NodeRequireFunction;
  id: string;
  filename: string;
  loaded: boolean;
  parent: NodeModule;
  children: NodeModule[];
}

declare var module: NodeModule;
