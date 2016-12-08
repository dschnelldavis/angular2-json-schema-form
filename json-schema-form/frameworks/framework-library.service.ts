import { Injectable } from '@angular/core';

import { WidgetLibraryService } from '../widgets/widget-library.service';

// No framework - unmodified controls, with styles from layout only
import { NoFrameworkComponent } from './no-framework.component';

// Material Design Framework (under construction)
// https://github.com/angular/material2
// https://www.muicss.com/docs/v1/css-js/forms
// http://materializecss.com/forms.html
import { MaterialDesignComponent } from './material-design/material-design.component';
import { MaterialButtonComponent } from './material-design/material-button.component';
import { MaterialCheckboxComponent } from './material-design/material-checkbox.component';
import { MaterialCheckboxesComponent } from './material-design/material-checkboxes.component';
import { MaterialFileComponent } from './material-design/material-file.component';
import { MaterialFieldsetComponent } from './material-design/material-fieldset.component';
import { MaterialInputComponent } from './material-design/material-input.component';
import { MaterialNumberComponent } from './material-design/material-number.component';
import { MaterialRadiosComponent } from './material-design/material-radios.component';
import { MaterialSelectComponent } from './material-design/material-select.component';
import { MaterialSubmitComponent } from './material-design/material-submit.component';
import { MaterialTabsComponent } from './material-design/material-tabs.component';
import { MaterialTextareaComponent } from './material-design/material-textarea.component';

// Bootstrap 3 Framework
// https://github.com/valor-software/ng2-bootstrap
import { Bootstrap3Component } from './bootstrap-3.component';

// Bootstrap 4 Framework (not started)
// https://github.com/ng-bootstrap/ng-bootstrap
// http://v4-alpha.getbootstrap.com/components/forms/
import { Bootstrap4Component } from './bootstrap-4.component';
// Foundation 6 Framework (not started)
// https://github.com/zurb/foundation-sites
import { Foundation6Component } from './foundation-6.component';
// Semantic UI Framework (not started)
// https://github.com/vladotesanovic/ngSemantic
import { SemanticUIComponent } from './semantic-ui.component';

@Injectable()
export class FrameworkLibraryService {
  private defaultFrameworkType: string = 'bootstrap-3';
  private frameworks: { [type: string]: any } = {
    'no-framework': { framework: NoFrameworkComponent },
    'bootstrap-3': { framework: Bootstrap3Component },
    'bootstrap-4': { framework: Bootstrap4Component },
    'foundation-6': { framework: Foundation6Component },
    'material-design': {
      framework: MaterialDesignComponent,
      widgets: {
        'number': MaterialNumberComponent,
        'text': MaterialInputComponent,
        'file': MaterialFileComponent,
        'checkbox': MaterialCheckboxComponent,
        'submit': MaterialSubmitComponent,
        'button': MaterialButtonComponent,
        'select': MaterialSelectComponent,
        'textarea': MaterialTextareaComponent,
        'checkboxes': MaterialCheckboxesComponent,
        'radios': MaterialRadiosComponent,
        'fieldset': MaterialFieldsetComponent,
        'tabs': MaterialTabsComponent
      }
    },
    'smantic-ui': { framework: SemanticUIComponent },
  };

  constructor(private widgetLibrary: WidgetLibraryService) {}

  public setDefaultFramework(type: string): boolean {
    if (!type || typeof type !== 'string' || !this.hasFramework(type)) return false;
    if (type !== this.defaultFrameworkType) {
      const newFramework = this.frameworks[type];
      this.widgetLibrary.unRegisterFrameworkWidgets();
      if (newFramework.widgets) {
        this.widgetLibrary.registerFrameworkWidgets(newFramework.widgets);
      }
      this.defaultFrameworkType = type;
    }
    return true;
  }

  public hasFramework(type: string): boolean {
    if (!type || typeof type !== 'string') return false;
    return this.frameworks.hasOwnProperty(type);
  }

  public registerFramework(
    type: string, framework: any, setAsDefault: boolean = true
  ): boolean {
    if (!type || typeof type !== 'string' ||
      typeof framework !== 'object' || !framework.framework
    ) {
      return false;
    }
    this.frameworks[type] = framework;
    if (setAsDefault) { this.setDefaultFramework(type); }
    return true;
  }

  public unRegisterFramework(type: string): boolean {
    if (!type || typeof type !== 'string') return false;
    if (type === this.defaultFrameworkType) {
      this.defaultFrameworkType = 'bootstrap-3';
    }
    delete this.frameworks[type];
    return true;
  }

  public getFramework(type?: string): any {
    if (!this.hasFramework(type)) {
      if (type === 'all') return this.frameworks;
      type = this.defaultFrameworkType;
    }
    return this.frameworks[type].framework;
  }
}
