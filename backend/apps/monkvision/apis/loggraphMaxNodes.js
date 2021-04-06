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

    const rows = await db.getLogs(jsonReq.id, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    if (!rows) { LOG.error("DB read issue"); return CONSTANTS.FALSE_RESULT; }

    const x = [], y = [], info = [];

    for (const row of rows) {
        x.push(utils.fromSQLiteToUTCOrLocalTime(row.timestamp, jsonReq.notUTC));
        let data;
        try {
            data = JSON.parse(row.additional_status)
        }
        catch (e) {y.push(0); info.push('NA'); continue }
        y.push(data.max_data);
        info.push(`Node - ${data.node_hostname}:${data.node_port}, Data - ${data.max_data}`);
    }
    

    const result = { result: true, type: "bargraph", contents: { length: x.length, x, ys: [y], infos: [info] } };
    if (jsonReq.title) result.contents.title = jsonReq.title; return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);