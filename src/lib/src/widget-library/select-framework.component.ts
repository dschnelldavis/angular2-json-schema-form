import { Component, ComponentFactoryResolver } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { TemplateComponent } from './template.component';

@Component({
  selector: 'select-framework-widget',
  template: `<div #widgetContainer></div>`,
})
export class SelectFrameworkComponent extends TemplateComponent {

  constructor(jsf: JsonSchemaFormService, componentFactory: ComponentFactoryResolver) {
    super(jsf, componentFactory);
  }

  protected createComponent() {
    if (!this.newComponent && this.jsf.framework) {
      this.newComponent = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.jsf.framework)
      );
    }
  }
}
