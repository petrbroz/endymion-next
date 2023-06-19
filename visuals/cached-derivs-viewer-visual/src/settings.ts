'use strict';

import { formattingSettings } from 'powerbi-visuals-utils-formattingmodel';

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class Card extends FormattingSettingsCard {
    svfUrl = new formattingSettings.TextInput({
        name: 'svfUrl',
        displayName: 'SVF URL',
        description: 'URL to a cached SVF model.',
        placeholder: '',
        value: ''
    });
    name: string = 'design';
    displayName: string = 'Design';
    slices: Array<FormattingSettingsSlice> = [this.svfUrl];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    card = new Card();
    cards = [this.card];
}
