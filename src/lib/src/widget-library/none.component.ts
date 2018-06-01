import { Component } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { Widget } from './widget';

@Component({
  selector: 'none-widget',
  template: ``,
})
export class NoneComponent extends Widget {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

}
