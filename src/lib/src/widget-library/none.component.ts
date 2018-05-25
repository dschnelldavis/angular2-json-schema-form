import { Component } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { AbstractWidget } from '.';

@Component({
  selector: 'none-widget',
  template: ``,
})
export class NoneComponent extends AbstractWidget {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

}
