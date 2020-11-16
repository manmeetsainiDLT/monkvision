/** 
 * Returns as aggregated by query.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const db = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);
const utils = require(`${APP_CONSTANTS.LIB_DIR}/utils.js`);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	
	const queryParams = _getAdditionalQueryParams(jsonReq); const timeRange = utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange));
    queryParams.$from = timeRange.from; queryParams.$to = timeRange.to;
    const rows = await db.runGetQueryFromID(jsonReq.id, queryParams);
    if (!rows) {LOG.error("DB read issue"); return CONSTANTS.FALSE_RESULT;}

    const contents = {}; for (const key of rows[0].keys) contents[key] = rows[0][key];

    const result = {result: true, type: "piegraph", contents}; 
    if (jsonReq.title) result.contents.title = jsonReq.title; return result;
}

function _getAdditionalQueryParams(jsonReq) {
    const additional_params = {};
    for (const key of Object.keys(jsonReq)) if (key.startsWith("$qp_")) {
        const paramName = key.substring(4);
        additional_params[`$${paramName}`] = jsonReq[key];
    }
    return additional_params;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);