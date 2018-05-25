import { Component } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { AbstractWidget } from '.';

// TODO: Add this control

@Component({
  selector: 'one-of-widget',
  template: ``,
})
export class OneOfComponent extends AbstractWidget {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

}
