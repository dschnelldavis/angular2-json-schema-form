import { Component } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';

import { AbstractWidget } from '.';

// TODO: Add this control

@Component({
  selector: 'file-widget',
  template: ``,
})
export class FileComponent extends AbstractWidget {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

}
