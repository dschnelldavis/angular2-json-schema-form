import { Inject, Injectable } from '@angular/core';

import { WidgetLibraryService } from '../widget-library/widget-library.service';
import { hasOwn } from '../shared/utility.functions';

import { Framework } from './framework';

import { FrameworkNoFramework } from './framework.no-framework';

// Possible future frameworks:
// - Foundation 6:
//   http://justindavis.co/2017/06/15/using-foundation-6-in-angular-4/
//   https://github.com/zurb/foundation-sites
// - Semantic UI:
//   https://github.com/edcarroll/ng2-semantic-ui
//   https://github.com/vladotesanovic/ngSemantic

@Injectable()
export class FrameworkLibraryService {
  activeFramework: Framework = null;
  stylesheets: (HTMLStyleElement|HTMLLinkElement)[];
  scripts: HTMLScriptElement[];
  loadExternalAssets = false;
  defaultFramework = 'no-framework';
  frameworkLibrary: Framework[] = [];

  constructor(
    @Inject(WidgetLibraryService) private widgetLibrary: WidgetLibraryService,
      @Inject(Framework) _frameworks: any[]
  ) {
    for (let framework of _frameworks) {
       this.frameworkLibrary[framework.name] = framework;
    }
  }

  public setLoadExternalAssets(loadExternalAssets = true): void {
    this.loadExternalAssets = !!loadExternalAssets;
  }

  public setFramework(
    framework?: string|Framework, loadExternalAssets = this.loadExternalAssets
  ): boolean {
    if (!framework) { return false; }
    let registerNewWidgets = false;
    if (!framework || framework === 'default') {
      this.activeFramework = this.frameworkLibrary[this.defaultFramework];
      registerNewWidgets = true;
    } else if (typeof framework === 'string' && this.hasFramework(framework)) {
      this.activeFramework = this.frameworkLibrary[framework];
      registerNewWidgets = true;
    } else if (typeof framework === 'object' && hasOwn(framework, 'framework')) {
      this.activeFramework = framework;
      registerNewWidgets = true;
    }
    if (!this.activeFramework) {
      console.error('Framework: ' + framework + ' not found');
      this.activeFramework = new FrameworkNoFramework();
    }
    return registerNewWidgets ?
      this.registerFrameworkWidgets(this.activeFramework) :
      registerNewWidgets;
  }

  registerFrameworkWidgets(framework: Framework): boolean {
    return hasOwn(framework, 'widgets') ?
      this.widgetLibrary.registerFrameworkWidgets(framework.widgets) :
      this.widgetLibrary.unRegisterFrameworkWidgets();
  }

  public hasFramework(type: string): boolean {
    return hasOwn(this.frameworkLibrary, type);
  }

  public getFramework(): any {
    if (!this.activeFramework) { this.setFramework('default', true); }
    return this.activeFramework.framework;
  }

  public getFrameworkWidgets(): any {
    return this.activeFramework.widgets || {};
  }

  public getFrameworkStylesheets(load: boolean = this.loadExternalAssets): string[] {
    return (load && this.activeFramework.stylesheets) || [];
  }

  public getFrameworkScripts(load: boolean = this.loadExternalAssets): string[] {
    return (load && this.activeFramework.scripts) || [];
  }
}
