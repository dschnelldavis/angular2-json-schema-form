import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';


import { JsonSchemaFormModule } from '../index';
// To include JsonSchemaFormModule after downloading from NPM, use this instead:
// import { JsonSchemaFormModule } from 'angular2-json-schema-form';

import { PlaygroundComponent } from './playground.component';
import { PlaygroundContainerComponent } from './playground-container.component';
import { AceEditorDirective } from './ace-editor.directive';
import { routing, appRoutingProviders } from './playground.routing';

@NgModule({
  imports: [ BrowserModule, HttpModule, routing, JsonSchemaFormModule.forRoot() ],
  declarations: [
    PlaygroundContainerComponent, PlaygroundComponent, AceEditorDirective
  ],
  providers: [ appRoutingProviders ],
  bootstrap: [ PlaygroundContainerComponent ]
})
export class PlaygroundModule { }
