import { Injectable } from '@angular/core';

import { NoFrameworkComponent } from './no-framework.component';
// No framework - just adds html <label>
import { MaterialDesignComponent } from './material-design.component';
// Uses https://github.com/angular/material2
// https://www.muicss.com/docs/v1/css-js/forms
// http://materializecss.com/forms.html
import { Bootstrap3Component } from './bootstrap3.component';
// Uses https://github.com/valor-software/ng2-bootstrap
import { Bootstrap4Component } from './bootstrap4.component';
// Uses https://github.com/ng-bootstrap/ng-bootstrap
import { Foundation6Component } from './foundation6.component';
// Uses https://github.com/zurb/foundation-sites
import { SemanticUIComponent } from './semantic-ui.component';
// Uses https://github.com/vladotesanovic/ngSemantic

@Injectable()
export class FrameworkLibraryService {

  private defaultFramework: string = 'bootstrap3';
  private frameworks: { [type: string]: any } = {
    'none': NoFrameworkComponent,
    'bootstrap3': Bootstrap3Component,
    'bootstrap4': Bootstrap4Component,
    'foundation6': Foundation6Component,
    'materialdesign': MaterialDesignComponent,
    'smanticui': SemanticUIComponent,
  };

  public setDefaultFramework(type: string) {
    if (!this.hasFramework(type)) return false;
    this.defaultFramework = type;
    return true;
  }

  public hasFramework(type: string) {
    if (!type || typeof type !== 'string') return false;
    return this.frameworks.hasOwnProperty(type);
  }

  public registerFramework(type: string, framework: any) {
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
