import { Component, ComponentFactoryResolver } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { TemplateComponent } from './template.component';

@Component({
  selector: 'select-widget-widget',
  template: `<div #widgetContainer></div>`,
})
export class SelectWidgetComponent extends TemplateComponent {

  constructor(jsf: JsonSchemaFormService, componentFactory: ComponentFactoryResolver) {
    super(jsf, componentFactory);
  }

  protected createComponent() {
    if (!this.newComponent && (this.layoutNode || {}).widget) {
      this.newComponent = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
    }
  }
}
