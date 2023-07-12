'use strict';

import powerbi from 'powerbi-visuals-api';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';
import './../style/visual.less';

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from './settings';

import { initializeViewerRuntime, loadModel, getExternalIdMap } from './viewer.utils';
import { getShare } from './shares.utils';

/**
 * Custom visual wrapper for the Autodesk Platform Services Viewer.
 */
export class Visual implements IVisual {
    private container: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private shareUrl: string = '';
    private viewer: Autodesk.Viewing.GuiViewer3D = null;
    private model: Autodesk.Viewing.Model = null;
    private externalIdsMap: { [externalId: string]: number } = null;

    /**
     * Initializes the viewer visual.
     * @param options Additional visual initialization options.
     */
    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.container = options.element;
    }

    /**
     * Notifies the viewer visual of an update (data, viewmode, size change).
     * @param options Additional visual update options.
     */
    public async update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);
        if (this.formattingSettings.card.shareUrl.value !== this.shareUrl) {
            this.shareUrl = this.formattingSettings.card.shareUrl.value;
            this.updateViewer();
        }
        if (this.viewer && this.externalIdsMap && options.dataViews.length > 0) {
            const externalIds = options.dataViews[0]?.table?.rows;
            if (externalIds?.length > 0) {
                //@ts-ignore
                const dbids = externalIds.map(e => this.externalIdsMap[e[0]]);
                this.viewer.isolate(dbids);
                this.viewer.fitToView(dbids);
            }
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private async updateViewer(): Promise<void> {
        // One time initialization of the viewer runtime and the viewer itself
        if (!this.viewer) {
            await initializeViewerRuntime({
                getAccessToken: async (callback: (access_token: string, expires_in: number) => void) => {
                    try {
                        const share = await getShare(this.shareUrl);
                        const { access_token, expires_in } = share.credentials;
                        callback(access_token, expires_in);
                    } catch (err) {
                        alert('Could not retrieve access token for the viewer. See console for more details.');
                        console.error(err);
                    }
                }
            });
            this.viewer = new Autodesk.Viewing.GuiViewer3D(this.container);
            this.viewer.start();
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async (ev) => {
                this.externalIdsMap = await getExternalIdMap(ev.model);
            });
        }

        // Unload any previously loaded models
        if (this.model) {
            this.viewer.unloadModel(this.model);
            this.model = null;
            this.externalIdsMap = null;
        }

        // Load a model from the new share URL
        try {
            const share = await getShare(this.shareUrl);
            (Autodesk.Viewing as any).refreshToken(share.credentials.access_token);
            this.model = await loadModel(this.viewer, share.urn);
        } catch (err) {
            alert('Could not load model in the viewer. See console for more details.');
            console.error(err);
        }
    }
}
