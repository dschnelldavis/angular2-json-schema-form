import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { frameworkList } from './frameworks/index';
import { widgetList } from './widgets/index';
const widgetsAndFrameworks = [].concat(widgetList).concat(frameworkList);

import { OrderableDirective } from './utilities/index';
import { JsonSchemaFormComponent } from './json-schema-form.component';
const allComponents = [
  JsonSchemaFormComponent, OrderableDirective
].concat(widgetsAndFrameworks);

import { FrameworkLibraryService } from './frameworks/index';
import { WidgetLibraryService } from './widgets/index';

@NgModule({
  imports: [ BrowserModule, FormsModule, ReactiveFormsModule ],
  declarations: allComponents,
  entryComponents: widgetsAndFrameworks,
  exports: allComponents,
  providers: [ WidgetLibraryService, FrameworkLibraryService ]
})
export class JsonSchemaFormModule { }
