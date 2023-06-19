'use strict';

import { formattingSettings } from 'powerbi-visuals-utils-formattingmodel';

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class Card extends FormattingSettingsCard {
    shareUrl = new formattingSettings.TextInput({
        name: 'shareUrl',
        displayName: 'Share URL',
        description: 'Link to a design in Autodesk Construction Cloud or BIM360 project.',
        placeholder: '',
        value: '' // https://aps-custom-shares.fly.dev/shares/dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLmlDSkt2TDI4UnFpQjFPOHE3bkdfeFE_dmVyc2lvbj0x/1cqKKp38wA80P15eIUKwUw
    });
    name: string = 'design';
    displayName: string = 'Design';
    slices: Array<FormattingSettingsSlice> = [this.shareUrl];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    card = new Card();
    cards = [this.card];
}
