/* eslint-disable no-restricted-globals */
/**
* +--------------------------------------------------------------------+
* | This MySource Matrix CMS file is Copyright (c) Squiz Pty Ltd       |
* | ABN 77 084 670 600                                                 |
* +--------------------------------------------------------------------+
* | IMPORTANT: Your use of this Software is subject to the terms of    |
* | the Licence provided in the file licence.txt. If you cannot find   |
* | this file please contact Squiz (www.squiz.com.au) so we may provide|
* | you a copy.                                                        |
* +--------------------------------------------------------------------+
*/

window.Matrix = window.Matrix || {};
Matrix.AssetLocator = {

    /**
     * Wrapper for handling lineages locating
     * @param {Element} btn  Clicked asset locator button
     */
    handleLocatingLineages(btn) {
        const self = this;
        const $btn = $(btn);
        const assetid = $btn.attr('data-asset-id');
        const lineages = $btn.attr('data-lineage-assetids');
        const sortOrders = $btn.attr('data-sort-orders');

        if (lineages !== undefined) {
            // we got lineage asset ids, so just locate it in Asset Map
            this.locateLineageInAssetMap(JSON.parse(lineages), JSON.parse(sortOrders));
        } else if (assetid !== undefined) {
            // grab the lineage selector wrapper for the asset locator button
            const $lineagesSelector = $(`.js_sq-dropdown-body[data-tooltip_id="${btn.getAttribute('data-tooltip_id')}"]`);
            // get asset lineage data
            this.getAssetLineages(assetid, (lineagesData) => {
                self.locateLineages(lineagesData, $lineagesSelector);
            });
        }
    },

    /**
     * Get the asset lineage data via AJAX
     * @param {string}   assetId
     * @param {function} callback
     */
    getAssetLineages(assetId, callback) {
        ajax_request(`${Matrix.backendBaseUrl || ''}?SQ_ACTION=get_asset_locator_lineages`, (response) => {
            if (response !== null) {
                callback(JSON.parse(response));
            }
        },
        'POST',
        `assetid=${assetId}`);
    },

    /**
     * Locate the asset lineage(s). If lineage data contains:
     * - lineage selector HTML, show lineages selector UI
     * - lineage asset IDs, just locate it in the asset map
     * @param {array}  lineagesData
     * @param {jQuery} $lineagesSelector
     */
    locateLineages(lineagesData, $lineagesSelector) {
        if (lineagesData.hasOwnProperty('lineagesSelectorHtml') && $lineagesSelector.length) {
            // show the lineage selector
            this.showLineagesSelection(lineagesData.lineagesSelectorHtml, $lineagesSelector);
        } else if (lineagesData.hasOwnProperty('lineages')) {
            // single lineage so just locate it
            this.locateLineageInAssetMap(lineagesData.lineages[0].lineage_assetids, lineagesData.lineages[0].sort_orders);
        }
    },

    /**
     * Show the lineage selector tooltip
     * @param {string} linegagesSelectorHtml
     * @param {jQuery} $lineagesSelector
     */
    showLineagesSelection(linegagesSelectorHtml, $lineagesSelector) {
        $lineagesSelector.find('.js_sq-lineages-selection').html(linegagesSelectorHtml);
        $lineagesSelector.removeClass('invisible');
    },

    /**
     * Delegate to Asset Map to locate the given asset lineage
     * @param {array} lineageAssetIds
     * @param {array} sortOrders
     */
    locateLineageInAssetMap(lineageAssetIds, sortOrders) {
        let am = parent.top.frames.sq_sidenav;

        if (self.name === 'hipo_job') {
            am = opener;
        } else if (1 && (typeof opener !== 'undefined') && (opener != null) && (!opener.closed)) {
            am = opener.parent.top.frames.sq_sidenav;
        }
        if (am.JS_Asset_Map.isBusy() === false) {
            am.JS_Asset_Map.locateAsset(lineageAssetIds, sortOrders);
            window.Matrix.showAssetTree();
        }
        // close tooltips.
        if (typeof Matrix.toolTipManager !== 'undefined') {
            Matrix.toolTipManager.hideTooltips();
        }
    },
};
