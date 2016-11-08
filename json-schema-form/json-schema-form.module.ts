import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { frameworkList } from './frameworks/index';
import { FrameworkLibraryService } from './frameworks/index';
import { widgetList } from './widgets/index';
import { WidgetLibraryService } from './widgets/index';
import { JsonSchemaFormComponent } from './json-schema-form.component';

const widgetsAndFrameworks = [].concat(widgetList).concat(frameworkList);
const allComponents = [
  JsonSchemaFormComponent
].concat(widgetsAndFrameworks);

@NgModule({
  imports: [ BrowserModule, FormsModule, ReactiveFormsModule ],
  declarations: allComponents,
  entryComponents: widgetsAndFrameworks,
  exports: allComponents,
  providers: [ WidgetLibraryService, FrameworkLibraryService ]
})
export class JsonSchemaFormModule { }
