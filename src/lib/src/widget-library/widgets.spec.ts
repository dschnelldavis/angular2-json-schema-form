import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonSchemaFormService } from '../..';

import { AbstractWidget } from './abstract-widget';
import { AddReferenceComponent } from './add-reference.component';
import { ButtonComponent } from './button.component';
import { CheckboxComponent } from './checkbox.component';
import { CheckboxesComponent } from './checkboxes.component';

describe('widgets', () => {
    let fixture: ComponentFixture<any>;
    let mockFormService: JsonSchemaFormService;

    function setupCompoent<A extends AbstractWidget>(clazz: new (...args: any[]) => A, onBeforeInit: Function = (comp: A) => {}): A {
        fixture = TestBed.createComponent(clazz);

        const component = fixture.componentInstance;
        component.layoutNode = {};
        component.layoutIndex = [0];
        component.dataIndex = [];

        if (!onBeforeInit(component)) {
            fixture.detectChanges();
        }

        return component;
    }

    beforeEach(async(() => {
        mockFormService = jasmine.createSpyObj('JsonSchemaFormService', {
            addItem: undefined,
            getFormControl: null,
            getFormControlValue: null,
            getParentNode: {},
            initializeControl: undefined,
            setArrayItemTitle: '',
            updateArrayCheckboxList: undefined,
            updateValue: undefined
        });
        (<jasmine.Spy>mockFormService.initializeControl).and.callFake((comp) => {
            comp.options = comp.layoutNode.options;
        });

        TestBed.configureTestingModule({
            declarations: [
                AddReferenceComponent,
                ButtonComponent,
                CheckboxComponent,
                CheckboxesComponent
            ],
            providers: [{
                provide: JsonSchemaFormService,
                useValue: mockFormService
            }],
            schemas: [ NO_ERRORS_SCHEMA ]
        })
        .compileComponents();
    }));

    describe('AddReferenceComponent', () => {
        let component: AddReferenceComponent;

        beforeEach(() => {
            component = setupCompoent(AddReferenceComponent, (comp) => {
                comp.layoutNode.options = {maxItems: 3};
            });
        });

        it('should show Add button', () => {
            component.layoutNode.arrayItem = false;
            expect(component.showAddButton).toBeTruthy();

            component.layoutNode.arrayItem = true;
            component.layoutIndex = [0, 1, 2];
            expect(component.showAddButton).toBeTruthy();
        });

        it('should hide Add button', () => {
            component.layoutNode.arrayItem = true;
            component.layoutIndex = [0, 1, 2, 3, 4];
            expect(component.showAddButton).toBeFalsy();
        });

        it('should return button text from parent', () => {
            (<jasmine.Spy>mockFormService.getParentNode).and.returnValue({add: 'test'});
            expect(component.buttonText).toEqual('test');
            expect(mockFormService.setArrayItemTitle).not.toHaveBeenCalled();
        });

        it('should call jsf to get button text', () => {
            component.itemCount = 2;
            (<jasmine.Spy>mockFormService.setArrayItemTitle).and.returnValue('test');
            expect(component.buttonText).toEqual('test');
            expect(mockFormService.setArrayItemTitle).toHaveBeenCalledWith({
                dataIndex: [],
                layoutIndex: [],
                layoutNode: {}
            }, component.layoutNode, component.itemCount);
        });

        it('should call serve to add item', () => {
            component.addItem(jasmine.createSpyObj('event', ['preventDefault']));

            expect(mockFormService.addItem).toHaveBeenCalledWith(component);
        });
    });

    describe('ButtonComponent', () => {
        let component: ButtonComponent;

        beforeEach(() => {
            component = setupCompoent(ButtonComponent);
        });

        it('should use the default update method when no click handler', () => {
            component.updateValue({target: {value: null}});
            expect(mockFormService.updateValue).toHaveBeenCalledWith(component, null);
        });

        it('should use click handler from options', () => {
            component.options.onClick = jasmine.createSpy('onclick');
            component.updateValue({target: {value: null}});
            expect(mockFormService.updateValue).not.toHaveBeenCalled();
            expect(component.options.onClick).toHaveBeenCalledWith({target: {value: null}});
        });
    });

    describe('CheckboxComponent', () => {
        let component: CheckboxComponent;

        beforeEach(() => {
            component = setupCompoent(CheckboxComponent, (comp) => {
                comp.controlValue = true;
            });
        });

        it('should return true for checked', () => {
            (<jasmine.Spy>mockFormService.getFormControlValue).and.returnValue(true);
            expect(component.isChecked).toBeTruthy();
        });

        it('should return false for checked', () => {
            (<jasmine.Spy>mockFormService.getFormControlValue).and.returnValue(false);
            expect(component.isChecked).toBeFalsy();
        });

        it('should call jsf to update value', () => {
            component.updateValue({target: {checked: true}, preventDefault: jasmine.createSpy('0')});
            expect(mockFormService.updateValue).toHaveBeenCalledWith(component, true);

            component.updateValue({target: {}, preventDefault: jasmine.createSpy('1')});
            expect(mockFormService.updateValue).toHaveBeenCalledWith(component, false);
        });
    });

    describe('CheckboxesComponent', () => {
        let component: CheckboxesComponent;

        beforeEach(() => {
            component = setupCompoent(CheckboxesComponent, (comp) => {
                comp.controlValue = true;
                comp.layoutNode.options = {titleMap: [
                    {value: 'check1', name: 'Test1'},
                    {value: 'check2', name: 'Test2'}
                ]};

                return true;
            });
            (<jasmine.Spy>mockFormService.getFormControl).and.returnValue({value: ['check1']});
        });

        it('should have vertical orietation by default', () => {
            fixture.detectChanges();
            expect(component.layoutOrientation).toEqual('vertical');
        });

        it('should set orientation to horizontal', () => {
            component.layoutNode.type = 'checkboxes-inline';
            fixture.detectChanges();
            expect(component.layoutOrientation).toEqual('horizontal');
        });

        it('should initialize valeus in titleMap list', () => {
            component.boundControl = true;
            fixture.detectChanges();
            expect(component.checkboxList).toEqual([{
                name: 'Test1',
                value: 'check1',
                checked: true
            }, {
                name: 'Test2',
                value: 'check2',
                checked: false
            }]);
        });

        it('should update value in titleMap list', () => {
            component.boundControl = true;
            fixture.detectChanges();
            component.updateValue({target: {value: 'check2', checked: true}});
            expect(component.checkboxList).toEqual([{
                name: 'Test1',
                value: 'check1',
                checked: true
            }, {
                name: 'Test2',
                value: 'check2',
                checked: true
            }]);
        });

        it('should not call service to update control', () => {
            fixture.detectChanges();
            component.boundControl = false;
            component.updateValue({target: {}});
            expect(mockFormService.updateArrayCheckboxList).not.toHaveBeenCalled();
        });

        it('should call service to update bound control', () => {
            fixture.detectChanges();
            component.boundControl = true;
            component.updateValue({target: {}});
            expect(mockFormService.updateArrayCheckboxList).toHaveBeenCalledWith(component, component.checkboxList);
        });
    });
});
