import { NgModule }              from '@angular/core';
import { CommonModule }          from '@angular/common';

import { JsonSchemaFormService } from '../json-schema-form.service';

import { OrderableDirective }    from './orderable.directive';

@NgModule({
  imports:      [ CommonModule ],
  declarations: [ OrderableDirective ],
  exports:      [ OrderableDirective ],
  providers:    [ JsonSchemaFormService ]
})
export class SharedModule { }
