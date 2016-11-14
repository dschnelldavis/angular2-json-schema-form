import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { JsonSchemaFormService } from './json-schema-form.service';

import { frameworkList } from './frameworks/index';
import { widgetList } from './widgets/index';
const widgetsAndFrameworks = [].concat(widgetList).concat(frameworkList);

import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';

import { OrderableDirective } from './orderable.directive';
import { JsonSchemaFormComponent } from './json-schema-form.component';
const allComponents = widgetsAndFrameworks.concat([
  JsonSchemaFormComponent, OrderableDirective
]);

@NgModule({
  imports: [ CommonModule, FormsModule, ReactiveFormsModule ],
  declarations: allComponents,
  entryComponents: widgetsAndFrameworks,
  exports: [ JsonSchemaFormComponent ],
  providers: [
    FrameworkLibraryService, WidgetLibraryService, JsonSchemaFormService
  ],
})
export class JsonSchemaFormModule { }
