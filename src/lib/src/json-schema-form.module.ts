import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FrameworkLibraryModule }           from './framework-library/framework-library.module';
import { WidgetLibraryModule }              from './widget-library/widget-library.module';

import { JsonSchemaFormComponent }          from './json-schema-form.component';

import { FrameworkLibraryService }          from './framework-library/framework-library.service';
import { WidgetLibraryService }             from './widget-library/widget-library.service';
import { JsonSchemaFormService }            from './json-schema-form.service';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    FrameworkLibraryModule, WidgetLibraryModule
  ],
  declarations: [ JsonSchemaFormComponent ],
  exports: [ JsonSchemaFormComponent, FrameworkLibraryModule, WidgetLibraryModule ],
  providers: [ FrameworkLibraryService, WidgetLibraryService, JsonSchemaFormService ]
})
export class JsonSchemaFormModule { }
