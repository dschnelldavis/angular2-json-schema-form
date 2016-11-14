import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { PlaygroundComponent } from './playground.component';
import { PlaygroundContainerComponent } from './playground-container.component';
import { AceEditorDirective } from './ace-editor.directive';
import { routing, appRoutingProviders } from './playground.routing';

import { JsonSchemaFormModule } from '../json-schema-form/json-schema-form.module';
// Note - To include this module after downloading from NPM, use this instead:
// import { JsonSchemaFormModule } from 'angular2-json-schema-form';

@NgModule({
  imports: [
    BrowserModule, HttpModule, ReactiveFormsModule,
    JsonSchemaFormModule, routing
  ],
  declarations: [
    PlaygroundContainerComponent, PlaygroundComponent, AceEditorDirective
  ],
  providers: [ appRoutingProviders ],
  bootstrap: [ PlaygroundContainerComponent ]
})
export class PlaygroundModule { }
