import { Injectable } from '@angular/core';

import { NoFrameworkComponent } from './no-framework.component';
// No framework - just displays unmodified controls
import { MaterialDesignComponent } from './material-design.component';
// https://github.com/angular/material2
// https://www.muicss.com/docs/v1/css-js/forms
// http://materializecss.com/forms.html
import { Bootstrap3Component } from './bootstrap-3.component';
// https://github.com/valor-software/ng2-bootstrap
import { Bootstrap4Component } from './bootstrap-4.component';
// https://github.com/ng-bootstrap/ng-bootstrap
// http://v4-alpha.getbootstrap.com/components/forms/
import { Foundation6Component } from './foundation-6.component';
// https://github.com/zurb/foundation-sites
import { SemanticUIComponent } from './semantic-ui.component';
// https://github.com/vladotesanovic/ngSemantic

@Injectable()
export class FrameworkLibraryService {

  private defaultFramework: string = 'bootstrap-3';
  private frameworks: { [type: string]: any } = {
    'none': NoFrameworkComponent,
    'bootstrap-3': Bootstrap3Component,
    'bootstrap-4': Bootstrap4Component,
    'foundation-6': Foundation6Component,
    'materialdesign': MaterialDesignComponent,
    'smanticui': SemanticUIComponent,
  };

  public setDefaultFramework(type: string): boolean {
    if (!this.hasFramework(type)) return false;
    this.defaultFramework = type;
    return true;
  }

  public hasFramework(type: string): boolean {
    if (!type || typeof type !== 'string') return false;
    return this.frameworks.hasOwnProperty(type);
  }

  public registerFramework(type: string, framework: any): boolean {
    if (!type || !framework || typeof type !== 'string') return false;
    this.frameworks[type] = framework;
    return true;
  }

  public getFramework(type?: string): any {
    if (this.hasFramework(type)) return this.frameworks[type];
    if (type === 'all') return this.frameworks;
    return this.frameworks[this.defaultFramework];
  }
}
