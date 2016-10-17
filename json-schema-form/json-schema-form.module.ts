import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FrameworksModule } from './frameworks/frameworks.module';
import { WidgetsModule } from './widgets/widgets.module';
import { JsonSchemaFormComponent } from './json-schema-form.component';

@NgModule({
  imports: [
    BrowserModule, FormsModule, ReactiveFormsModule,
    FrameworksModule, WidgetsModule
  ],
  declarations: [ JsonSchemaFormComponent ],
  exports: [ JsonSchemaFormComponent ],
  providers: [ ]
})
export class JsonSchemaFormModule { }
