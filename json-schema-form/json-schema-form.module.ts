import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { JsonSchemaFormComponent } from './json-schema-form.component';
import { OrderableDirective } from './orderable.directive';

import { ALL_FRAMEWORKS } from './frameworks/index';
import { ALL_WIDGETS } from './widgets/index';

import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';
import { JsonSchemaFormService } from './json-schema-form.service';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MaterialModule.forRoot()
  ],
  declarations: [
    JsonSchemaFormComponent, OrderableDirective,
    ...ALL_FRAMEWORKS, ...ALL_WIDGETS
  ],
  entryComponents: [
    ...ALL_FRAMEWORKS, ...ALL_WIDGETS
  ],
  exports: [
    JsonSchemaFormComponent
  ],
  providers: [
    FrameworkLibraryService, WidgetLibraryService, JsonSchemaFormService
  ],
})
export class JsonSchemaFormModule { }
