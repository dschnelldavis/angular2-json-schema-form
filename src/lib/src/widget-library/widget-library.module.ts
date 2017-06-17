import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { OrderableDirective }               from './orderable.directive';

import { WidgetLibraryService }             from './widget-library.service';
import { JsonSchemaFormService }            from '../json-schema-form.service';

import { BASIC_WIDGETS }                    from './index';

@NgModule({
  imports:         [ CommonModule, FormsModule, ReactiveFormsModule ],
  declarations:    [ ...BASIC_WIDGETS, OrderableDirective ],
  exports:         [ ...BASIC_WIDGETS, OrderableDirective ],
  entryComponents: [ ...BASIC_WIDGETS ],
  providers:       [ JsonSchemaFormService, WidgetLibraryService ]
})
export class WidgetLibraryModule { }
