import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { JsonPointer } from '../shared/jsonpointer.functions';

/**
 * OrderableDirective
 *
 * Enables array elements to be reordered by dragging and dropping.
 *
 * Only works for arrays that have at least two elements.
 *
 * Also detects arrays-within-arrays, and correctly moves either
 * the child array element or the parent array element,
 * depending on the drop targert.
 *
 */
@Directive({
  selector: '[orderable]',
})
export class OrderableDirective implements OnInit {
  arrayPointer: string;
  listen: boolean = false;
  element: any;
  overParentElement: boolean = false;
  overChildElement: boolean = false;
  @Input() orderable: boolean;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private elementRef: ElementRef,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    if (this.orderable && this.layoutNode && this.layoutIndex && this.dataIndex) {
      this.element = this.elementRef.nativeElement;
      this.element.draggable = true;
      this.arrayPointer = JsonPointer.compile(
        JsonPointer.parse(this.jsf.getLayoutPointer(this)).slice(0, -1)
      );
      this.listen = true;
    }
  }

  /**
   * Listeners for movable element being dragged:
   *
   * dragstart: add 'dragging' class to element, set effectAllowed = 'move'
   * dragover: set dropEffect = 'move'
   * dragend: remove 'dragging' class from element
   */
  @HostListener('dragstart', ['$event']) onDragStart(event) {
    if (this.listen) {
      this.element.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      // Hack to bypass stupid HTML drag-and-drop dataTransfer protection
      // so drag source info will be available on dragenter
      sessionStorage.setItem(this.arrayPointer,
        this.dataIndex[this.dataIndex.length - 1] + ''
      );
      event.dataTransfer.setData('text/plain',
        this.dataIndex[this.dataIndex.length - 1] + this.arrayPointer
      );
    }
  }

  @HostListener('dragover', ['$event']) onDragOver(event) {
    if (event.preventDefault) event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return false;
  }

  @HostListener('dragend', ['$event']) onDragEnd(event) {
    event.preventDefault();
    if (this.listen) {
      this.element.classList.remove('dragging');
    }
  }

  /**
   * Listeners for stationary items being dragged over:
   *
   * dragenter: add 'drag-target-...' classes to element
   * dragleave: remove 'drag-target-...' classes from element
   * drop: remove 'drag-target-...' classes from element, move dropped array item
   */
  @HostListener('dragenter', ['$event']) onDragEnter(event) {
    // Part 1 of a hack, inspired by Dragster, to simulate mouseover and mouseout
    // behavior while dragging items - http://bensmithett.github.io/dragster/
    if (this.overParentElement) {
      return this.overChildElement = true;
    } else {
      this.overParentElement = true;
    }

    if (this.listen) {
      let sourceArrayIndex = sessionStorage.getItem(this.arrayPointer);
      if (sourceArrayIndex !== null) {
        if (this.dataIndex[this.dataIndex.length - 1] < +sourceArrayIndex) {
          this.element.classList.add('drag-target-top');
        } else if (this.dataIndex[this.dataIndex.length - 1] > +sourceArrayIndex) {
          this.element.classList.add('drag-target-bottom');
        }
      }
    }
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event) {
    // Part 2 of the Dragster hack
    if (this.overChildElement) {
      this.overChildElement = false;
    } else if (this.overParentElement) {
      this.overParentElement = false;
    }

    if (!this.overParentElement && !this.overChildElement && this.listen) {
      this.element.classList.remove('drag-target-top');
      this.element.classList.remove('drag-target-bottom');
    }
  }

  @HostListener('drop', ['$event']) onDrop(event) {
    if (this.listen) {
      this.element.classList.remove('drag-target-top');
      this.element.classList.remove('drag-target-bottom');
      // Confirm that drop target is another item in the same array as source item
      const sourceArrayIndex: number = +sessionStorage.getItem(this.arrayPointer);
      if (sourceArrayIndex !== this.dataIndex[this.dataIndex.length - 1]) {
        // Move array item
        this.jsf.moveArrayItem(
          this, sourceArrayIndex, this.dataIndex[this.dataIndex.length - 1]
        );
      }
      sessionStorage.removeItem(this.arrayPointer);
    }
    return false;
  }
}
