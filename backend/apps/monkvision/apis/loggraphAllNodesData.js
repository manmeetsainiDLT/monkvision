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
    if (!validateRequest(jsonReq)) {
        LOG.error("Validation failure.");
        return CONSTANTS.FALSE_RESULT;
    }

    let propertyToGather = jsonReq.propertyToGather || LOG.error("Type of data to get was not specified");
    let multiplicationFactor = jsonReq.multiplicationFactor || 1;

    const rows = await db.getLogs(jsonReq.id, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    if (!rows) {
        LOG.error("DB read issue");
        return CONSTANTS.FALSE_RESULT;
    }
    let x = [],
        yArrays = [],
        infoArrays = [],
        legendArray = [];
    initLength = Object.keys(JSON.parse(rows[rows.length - 1].additional_status)).length;
    for (let i = 0; i < initLength; i++) {
        yArrays.push([]);
        infoArrays.push([]);
    }
    for (let row of rows) {
        x.push(utils.fromSQLiteToUTCOrLocalTime(row.timestamp, jsonReq.notUTC));
        let parsedAddStatus;
        try {
            parsedAddStatus = JSON.parse(row.additional_status);
                for (let arr in yArrays) {
                    let data = (Object.keys(parsedAddStatus)[arr]);
                    yArrays[arr].push((parsedAddStatus[data][propertyToGather])*multiplicationFactor)
                    infoArrays[arr].push(data + " - " + propertyToGather + " - " + (parsedAddStatus[data][propertyToGather])*multiplicationFactor);
                }            
        } catch (e) {
            LOG.error(`Error incountered and catched in loggraphAllNodesData.js for property ${propertyToGather} at timestamp ${row.timestamp}: ${e}`);
            for (let arr in yArrays) {
                yArrays[arr].push(0.1);
                infoArrays[arr].push("NA");
            }
        }
    }
    for (let i = 0; i < initLength; i++) legendArray.push(infoArrays[i][infoArrays.length-1].split('-')[0].trim().toUpperCase());

    const result = {
        result: true,
        type: "linegraph",
        contents: {
            length: x.length,
            x,
            ys: yArrays,
            infos: infoArrays,
            legend: legendArray
        }
    };
    if (jsonReq.title) result.contents.title = jsonReq.title;
    return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);