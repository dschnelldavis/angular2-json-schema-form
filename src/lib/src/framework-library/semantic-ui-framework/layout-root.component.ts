import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { hasValue, JsonPointer } from '../../shared';

@Component({
  selector: 'layout-root-widget',
  template: `
    <div [class]="toCSSClass(this)">
      <div *ngFor="let layoutNode of layout; let i = index"
           [class]="layoutNode.items !== undefined ? '' : 'field'"
        [style.order]="layoutNode?.options?.order">
        <select-framework-widget *ngIf="showWidget(layoutNode)"
          [dataIndex]="layoutNode?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
          [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutNode"></select-framework-widget>
      </div>
    </div>`,
  styles: [`
      .array-item {padding-right: 25px; padding-top: 17px;}
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class LayoutRootComponent {
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isFlexItem = false;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  removeItem(item) {
    this.jsf.removeItem(item);
  }

  toCSSClass(flrc: LayoutRootComponent) {
    if (flrc.layout.length > 0 && flrc.layout[0].items !== undefined) {
      return '';
    } else if (flrc.layout.length > 1) {
      return 'ui ' + this.toHumanNumber(flrc.layout.length) + ' fields';
    } else {
      return '';
    }
  }

  toHumanNumber(num: number) {
    switch (num) {
      case 1: return 'one';
      case 2: return 'two';
      case 3: return 'three';
      case 4: return 'four';
      case 5: return 'five';
      case 6: return 'six';
      case 7: return 'seven';
      case 8: return 'eight';
    }
  }

  showWidget(layoutNode: any): boolean {
    return this.jsf.evaluateCondition(layoutNode, this.dataIndex);
  }
}
