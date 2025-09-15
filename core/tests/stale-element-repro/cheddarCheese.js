/**
 * Cheddar Cheese - KRAFTWorks Support Library
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

var KRAFTWorks = typeof(KRAFTWorks) === 'undefined' ? {} : KRAFTWorks;

KRAFTWorks.stiltonBuy = {
    bindWatermark : function(element, text) {
        element.watermark(text, {className: 'stiltonBuyLoginInputDefaultText'});
    },
};
