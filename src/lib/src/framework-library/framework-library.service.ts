import { Inject, Injectable }               from '@angular/core';

import { WidgetLibraryService }             from '../widget-library/widget-library.service';

// No framework - unmodified HTML controls, with styles from layout only
import { NoFrameworkComponent }             from './no-framework.component';

// Material Design Framework
// https://github.com/angular/material2
import { FlexLayoutRootComponent }          from './material-design-framework/flex-layout-root.component';
import { FlexLayoutSectionComponent }       from './material-design-framework/flex-layout-section.component';
import { MaterialAddReferenceComponent }    from './material-design-framework/material-add-reference.component';
import { MaterialButtonComponent }          from './material-design-framework/material-button.component';
import { MaterialButtonGroupComponent }     from './material-design-framework/material-button-group.component';
import { MaterialCardComponent }            from './material-design-framework/material-card.component';
import { MaterialCheckboxComponent }        from './material-design-framework/material-checkbox.component';
import { MaterialCheckboxesComponent }      from './material-design-framework/material-checkboxes.component';
import { MaterialDatepickerComponent }      from './material-design-framework/material-datepicker.component';
import { MaterialFileComponent }            from './material-design-framework/material-file.component';
import { MaterialInputComponent }           from './material-design-framework/material-input.component';
import { MaterialNumberComponent }          from './material-design-framework/material-number.component';
import { MaterialRadiosComponent }          from './material-design-framework/material-radios.component';
import { MaterialSelectComponent }          from './material-design-framework/material-select.component';
import { MaterialSliderComponent }          from './material-design-framework/material-slider.component';
import { MaterialTabsComponent }            from './material-design-framework/material-tabs.component';
import { MaterialTextareaComponent }        from './material-design-framework/material-textarea.component';
import { MaterialDesignFrameworkComponent } from './material-design-framework/material-design-framework.component';

// Bootstrap 3 Framework
// https://github.com/valor-software/ng2-bootstrap
import { Bootstrap3FrameworkComponent }     from './bootstrap-3-framework.component';

// Suggested future frameworks:

// Bootstrap 4:
// https://github.com/ng-bootstrap/ng-bootstrap
// http://v4-alpha.getbootstrap.com/components/forms/

// Foundation 6:
// https://github.com/zurb/foundation-sites

// Semantic UI:
// https://github.com/vladotesanovic/ngSemantic

export type Framework = {
  framework: any,
  widgets?: { [key: string]: any },
  stylesheets?: string[],
  scripts?: string[]
};

export type FrameworkLibrary = { [key: string]: Framework };

@Injectable()
export class FrameworkLibraryService {
  activeFramework: Framework = null;
  stylesheets: (HTMLStyleElement|HTMLLinkElement)[];
  scripts: HTMLScriptElement[];
  loadExternalAssets: boolean = false;
  defaultFramework: string = 'material-design';
  frameworkLibrary: FrameworkLibrary = {
    'no-framework': { framework: NoFrameworkComponent },
    'material-design': {
      framework: MaterialDesignFrameworkComponent,
      widgets: {
        'root':         FlexLayoutRootComponent,
        'section':      FlexLayoutSectionComponent,
        '$ref':         MaterialAddReferenceComponent,
        'number':       MaterialNumberComponent,
        'slider':       MaterialSliderComponent,
        'text':         MaterialInputComponent,
        'date':         MaterialDatepickerComponent,
        'file':         MaterialFileComponent,
        'checkbox':     MaterialCheckboxComponent,
        'button':       MaterialButtonComponent,
        'buttonGroup':  MaterialButtonGroupComponent,
        'select':       MaterialSelectComponent,
        'textarea':     MaterialTextareaComponent,
        'checkboxes':   MaterialCheckboxesComponent,
        'radios':       MaterialRadiosComponent,
        'card':         MaterialCardComponent,
        'tabs':         MaterialTabsComponent,
        'alt-date':     'date',
        'range':        'slider',
        'submit':       'button',
        'radiobuttons': 'buttonGroup',
        'color':        'none',
        'hidden':       'none',
        'image':        'none',
      },
      stylesheets: [
        '//fonts.googleapis.com/icon?family=Material+Icons',
        '//fonts.googleapis.com/css?family=Roboto:300,400,500,700',
        // '//maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css',
        // './node_modules/@angular/material/core/theming/prebuilt/deeppurple-amber.css',
        // './node_modules/@angular/material/core/theming/prebuilt/indigo-pink.css',
      ],
    },
    'bootstrap-3': {
      framework: Bootstrap3FrameworkComponent,
      stylesheets: [
        '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
        '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css',
      ],
      scripts: [
        // '//code.jquery.com/jquery-2.1.1.min.js',
        '//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js',
        // '//code.jquery.com/ui/1.12.1/jquery-ui.min.js',
        '//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js',
        '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
      ],
    }
  };

  constructor(
    @Inject(WidgetLibraryService) private widgetLibrary: WidgetLibraryService
  ) { }

  registerFrameworkWidgets(framework: Framework): boolean {
    if (framework.hasOwnProperty('widgets')) {
      this.widgetLibrary.registerFrameworkWidgets(framework.widgets);
      return true;
    }
    this.widgetLibrary.unRegisterFrameworkWidgets();
    return false;
  }

  public setLoadExternalAssets(loadExternalAssets: boolean = true): void {
    this.loadExternalAssets = !!loadExternalAssets;
  }

  public setFramework(
    framework?: string|Framework, loadExternalAssets: boolean = this.loadExternalAssets
  ): boolean {
    if (!framework) return false;
    let validNewFramework: boolean = false;
    if (!framework || framework === 'default') {
      this.activeFramework = this.frameworkLibrary[this.defaultFramework];
      validNewFramework = true;
    } else if (typeof framework === 'string' && this.hasFramework(framework)) {
      this.activeFramework = this.frameworkLibrary[framework];
      validNewFramework = true;
    } else if (typeof framework === 'object' && framework.hasOwnProperty('framework')) {
      this.activeFramework = framework;
      validNewFramework = true;
    }
    if (validNewFramework) {
      this.registerFrameworkWidgets(this.activeFramework);
    }
    return validNewFramework;
  }

  public hasFramework(type: string): boolean {
    if (!type || typeof type !== 'string') return false;
    return this.frameworkLibrary.hasOwnProperty(type);
  }

  public getFramework(): any {
    if (!this.activeFramework) this.setFramework('default', true);
    return this.activeFramework.framework;
  }

  public getFrameworkWidgets(): any {
    return this.activeFramework.widgets || {};
  }

  public getFrameworkStylesheets(load: boolean = this.loadExternalAssets): string[] {
    return load ? this.activeFramework.stylesheets || [] : [];
  }

  public getFrameworkScripts(load: boolean = this.loadExternalAssets): string[] {
    return load ? this.activeFramework.scripts || [] : [];
  }
}
