'use strict';

import powerbi from 'powerbi-visuals-api';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';
import './../style/visual.less';

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from './settings';

import { initializeViewerRuntime } from './viewer.utils';

export class Visual implements IVisual {
    private container: HTMLElement;
    private viewer: Autodesk.Viewing.GuiViewer3D;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private svfUrl: string = '';

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.container = options.element;
    }

    public async update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);
        if (this.formattingSettings.card.svfUrl.value !== this.svfUrl) {
            this.svfUrl = this.formattingSettings.card.svfUrl.value;
            this.updateViewer();
        }
        if (this.viewer && options.dataViews.length > 0) {
            const categories = options.dataViews[0]?.categorical?.categories;
            if (categories && categories.length > 0) {
                //@ts-ignore
                const dbids = categories[0].values.map(e => parseInt(e));
                this.viewer.isolate(dbids);
                this.viewer.fitToView(dbids);
            }
        }
    }

    private async updateViewer(): Promise<void> {
        if (!this.viewer) {
            await initializeViewerRuntime({ env: 'Local' });
            this.viewer = new Autodesk.Viewing.GuiViewer3D(this.container);
            this.viewer.start();
        } else {
            for (const model of this.viewer.getAllModels()) {
                this.viewer.unloadModel(model);
            }
        }

        try {
            this.viewer.loadModel(this.svfUrl, null);
        } catch (err) {
            alert('Could not load model in the viewer. See console for more details.');
            console.error(err);
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
