'use strict';

import powerbi from 'powerbi-visuals-api';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';
import './../style/visual.less';

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from './settings';

import { initializeViewerRuntime, loadModel, getVisibleNodes, getExternalIdMap, getExternalIds } from './viewer.utils';
import { getShare } from './shares.utils';

/**
 * Custom visual wrapper for the Autodesk Platform Services Viewer.
 */
export class Visual implements IVisual {
    private host: IVisualHost;
    private container: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private currentDataView: DataView = null;
    private selectionManager: ISelectionManager = null;
    private shareUrl: string = '';
    private viewer: Autodesk.Viewing.GuiViewer3D = null;
    private model: Autodesk.Viewing.Model = null;
    private externalIdsMap: { [externalId: string]: number } = null;

    /**
     * Initializes the viewer visual.
     * @param options Additional visual initialization options.
     */
    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.container = options.element;
    }

    /**
     * Notifies the viewer visual of an update (data, viewmode, size change).
     * @param options Additional visual update options.
     */
    public async update(options: VisualUpdateOptions) {
        this.logUpdateOptions(options);
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);
        if (this.formattingSettings.card.shareUrl.value !== this.shareUrl) {
            this.shareUrl = this.formattingSettings.card.shareUrl.value;
            this.updateViewer();
        }
        if (options.dataViews.length > 0) {
            this.currentDataView = options.dataViews[0];
        }
        if (this.viewer && this.externalIdsMap && this.currentDataView) {
            const externalIds = this.currentDataView.table?.rows;
            if (externalIds?.length > 0) {
                //@ts-ignore
                const dbids = externalIds.map(e => this.externalIdsMap[e[0]]);
                this.viewer.select(dbids);
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

    private logUpdateOptions(options: VisualUpdateOptions): void {
        const VisualUpdateTypes = {
            [powerbi.VisualUpdateType.All]: 'All',
            [powerbi.VisualUpdateType.Resize]: 'Resize',
            [powerbi.VisualUpdateType.ResizeEnd]: 'ResizeEnd',
            [powerbi.VisualUpdateType.Data]: 'Data',
            [powerbi.VisualUpdateType.Style]: 'Style',
            [powerbi.VisualUpdateType.ViewMode]: 'ViewMode'
        };
        const ViewModes = {
            [powerbi.ViewMode.Edit]: 'Edit',
            [powerbi.ViewMode.InFocusEdit]: 'InFocusEdit',
            [powerbi.ViewMode.View]: 'View'
        };
        const EditModes = {
            [powerbi.EditMode.Default]: 'Default',
            [powerbi.EditMode.Advanced]: 'Advanced'
        };
        const VisualDataChangeOperationKinds = {
            [powerbi.VisualDataChangeOperationKind.Create]: 'Create',
            [powerbi.VisualDataChangeOperationKind.Segment]: 'Segment'
        };
        console.info(
            'VisualUpdateType:', VisualUpdateTypes[options.type],
            'ViewMode:', ViewModes[options.viewMode],
            'EditMode:', EditModes[options.editMode],
            'VisualDataChangeOperationKind', VisualDataChangeOperationKinds[options.operationKind]);
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
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onPropertiesLoaded.bind(this));
            this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, this.onIsolationChanged.bind(this));
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

    private async onPropertiesLoaded() {
        this.externalIdsMap = await getExternalIdMap(this.model);
    }

    private async onIsolationChanged() {
        const allExternalIds = this.currentDataView?.table?.rows;
        if (!allExternalIds) {
            return;
        }
        const visibleNodeIds = getVisibleNodes(this.model);
        const selectedExternalIds = await getExternalIds(this.model, visibleNodeIds);
        const selectionIds: powerbi.extensibility.ISelectionId[] = [];
        for (const selectedExternalId of selectedExternalIds) {
            const rowIndex = allExternalIds.findIndex(row => row[0] === selectedExternalId);
            if (rowIndex !== -1) {
                const selectionId = this.host.createSelectionIdBuilder()
                    .withTable(this.currentDataView.table, rowIndex)
                    .createSelectionId();
                selectionIds.push(selectionId);
            }
        }
        this.selectionManager.select(selectionIds);
    }
}
