import { enableProdMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { ReactiveFormsModule } from '@angular/forms';


import { JsonSchemaFormModule } from '../library/json-schema-form.module';
// To include JsonSchemaFormModule after downloading from NPM, use this instead:
// import { JsonSchemaFormModule } from 'angular2-json-schema-form';

import { PlaygroundComponent } from './playground.component';
import { PlaygroundContainerComponent } from './playground-container.component';
import { AceEditorDirective } from './ace-editor.directive';
import { routing, appRoutingProviders } from './playground.routing';

enableProdMode();
@NgModule({
  imports: [
    BrowserModule, HttpModule, ReactiveFormsModule,
    routing, JsonSchemaFormModule
  ],
  declarations: [
    PlaygroundContainerComponent, PlaygroundComponent, AceEditorDirective
  ],
  providers: [ appRoutingProviders ],
  bootstrap: [ PlaygroundContainerComponent ]
})
export class PlaygroundModule {}
