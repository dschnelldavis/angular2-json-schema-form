import { Component } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { Widget } from './widget';

// TODO: Add this control

@Component({
  selector: 'one-of-widget',
  template: ``,
})
export class OneOfComponent extends Widget {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

}
