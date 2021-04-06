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
    let nodeID = jsonReq.nodeID || "Master";
    let property = jsonReq.property || LOG.error("Type of property to get was not specified");
    const KBMultiplier = jsonReq.toKBits ? 8 : 1;
    const rows = await db.getLogs(jsonReq.id, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    if (!rows) {
        LOG.error("DB read issue");
        return CONSTANTS.FALSE_RESULT;
    }

    let x = [],infoArrays=[],yArrays=[],legendArray=[];
    try {
        let parsedInfo = JSON.parse(rows[rows.length - 1].additional_status)
        for (let i = 0; i < Object.keys(parsedInfo[nodeID]).length; i++) {
            yArrays.push([]);
            infoArrays.push([]);
            legendArray.push(Object.keys(parsedInfo[nodeID])[i]);
        }
    }
    catch (e){
        LOG.error(`Error in initializing arrays. Error - ${e}`);
    }
    for (let row of rows) {
        x.push(utils.fromSQLiteToUTCOrLocalTime(row.timestamp, jsonReq.notUTC));
        let parsedAddStatus;
        try {
            parsedAddStatus = JSON.parse(row.additional_status);
            let data;
            for (const index in Object.keys(parsedAddStatus[nodeID])){
                data = (Object.keys(parsedAddStatus[nodeID])[index]);
                yArrays[index].push(parsedAddStatus[nodeID][data][property]*KBMultiplier)
                infoArrays[index].push(data + " - " + property + " - " + parsedAddStatus[nodeID][data][property]*KBMultiplier);
            }
        } catch (e) { 
            LOG.error(`Error incountered and catched: ${e}`);
            for (const index in yArrays) {
                yArrays[index].push(0.5);
                infoArrays[index].push("NA");
            }
        }
    }
    const result = {
        result: true,
        type: "linegraph",
        contents: {
            length: x.length,
            x,
            ys: yArrays,
            infos: infoArrays,
            legends: legendArray
        }
    };
    if (jsonReq.title) result.contents.title = jsonReq.title;
    return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);