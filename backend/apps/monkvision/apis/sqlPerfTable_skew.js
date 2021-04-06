/** 
 * Returns MonBoss or CyberWarrior log file's contents.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */
const db = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);
const utils = require(`${APP_CONSTANTS.LIB_DIR}/utils.js`);

/**
 * Returns the log entries from MonBoss, or MonBoss type DBs. Note this API works in UTC unless the local
 * time adjustment flag is specified. 
 * @param {object} jsonReq Incoming request, must have the following
 *                  id - The ID of the log
 *                  timeRange - String in this format -> `{from:"UTC Time", to: "UTC Time"}`
 *                  
 *              Optionally
 *                  statusFalseValue - If status is false, then return it as this value, used only if statusAsBoolean - false
 *                  statusTrueeValue - If status is true, then return it as this value, used only if statusAsBoolean - false
 *                  statusAsBoolean - Return status as a boolean variable, not values
 *                  nullValue - If additonal status is null or empty return it as this value
 *                  notUTC - Return results in server's local time not UTC
 */
exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) { LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT; }

    // const rows = await db.getLogs(jsonReq.id, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    // if (!rows) {LOG.error("DB read issue"); return CONSTANTS.FALSE_RESULT;}

    const queryParams = _getAdditionalQueryParams(jsonReq); const timeRange = utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange));
    // queryParams.$from = timeRange.from;
    const rows = await db.runGetQueryFromID(jsonReq.id, queryParams);
    if (!rows) { LOG.error("DB read issue"); return CONSTANTS.FALSE_RESULT; }

    const x = [], y1 = [], y2 = [], y3 = [], y4 = [], y5 = [], y6 = [], y7 = [], y8 = [], info = [];
    // ,falseStatusValue = jsonReq.statusFalseValue?jsonReq.statusFalseValue:0.1,
    // trueStatusValue = jsonReq.statusTrueValue?jsonReq.statusTrueValue:1;
    let counter = 1;
    for (let row of rows) {
        // x.push(utils.fromSQLiteToUTCOrLocalTime(row.timestamp, jsonReq.notUTC));
        // if (jsonReq.statusAsBoolean && jsonReq.statusAsBoolean.toLowerCase() == "true") 
        // y.push(row.status==1?true:false); else y.push(row.status==1?trueStatusValue:falseStatusValue);
        let data_array;
        try {
            data_array = JSON.parse(row.additional_status);
        } catch (e) { }
        // if(Array.isArray(data_array)){
        for (let index = 0; index < data_array.length; index++) {
            let Query_database = data_array[index].database;
            let Query_table = data_array[index].table_name;
            let Query_mem_skew = data_array[index].mem_skew;
            let Query_row_skew = data_array[index].row_skew;
            
            x.push(counter);
            y1.push(Query_database);
            y2.push(Query_table);
            y3.push((Query_mem_skew).toFixed(3));
            y4.push((Query_row_skew).toFixed(3));
            
            info.push(!data_array[index] || data_array[index] == "" ?
            (jsonReq.nullValue ? jsonReq.nullValue : data_array[index]) : data_array[index]);
            counter += 1;
        }
        // }
    }

    const result = { result: true, type: "table", contents: { length: x.length, x, ys: [y1, y2, y3, y4], infos: [[], [], [], []] } };
    if (jsonReq.title) result.contents.title = jsonReq.title; return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);

function _getAdditionalQueryParams(jsonReq) {
    const additional_params = {};
    for (const key of Object.keys(jsonReq)) if (key.startsWith("$qp_")) {
        const paramName = key.substring(4);
        additional_params[`$${paramName}`] = jsonReq[key];
    }
    return additional_params;
}
