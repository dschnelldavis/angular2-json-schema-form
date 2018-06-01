import { Component } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';

import { Widget } from './widget';

// TODO: Add this control

@Component({
  selector: 'file-widget',
  template: ``,
})
export class FileComponent extends Widget {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

}
