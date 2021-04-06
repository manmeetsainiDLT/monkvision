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

    // const rows = await db.getLogs(jsonReq.id, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    // if (!rows) {LOG.error("DB read issue"); return CONSTANTS.FALSE_RESULT;}

    const queryParams = _getAdditionalQueryParams(jsonReq);
    const timeRange = utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange));
    // queryParams.$from = timeRange.from;
    const rows = await db.runGetQueryFromID(jsonReq.id, queryParams);
    if (!rows) {
        LOG.error("DB read issue");
        return CONSTANTS.FALSE_RESULT;
    }

    const x = [],
        y1 = [],
        y2 = [],
        y3 = [],
        y4 = [],
        y5 = [],
        y6 = [],
        y7 = [],
        y8 = [],
        y9 = [],
        y10 = []
    let serial_count=1;

    for (let row of rows) {
        let data_array;
        try {
            data_array = JSON.parse(row.additional_status);
        } catch (e) {}
        for (let index = 0; index < data_array.length; index++) {
            let Query_database = data_array[index].Query_database;
            let Query_user = data_array[index].Query_user;
            let Query_node_hostname = data_array[index].Query_node_hostname;
            let Query_node_port = data_array[index].Query_node_port;
            let Query_process_id = data_array[index].Query_process_id;
            let Query_elapsedTime = data_array[index].Query_elapsedTime;
            let Query_state = data_array[index].Query_state;
            let Query_text = data_array[index].Query_text;
            let Query_submit_time = data_array[index].Query_submit_time;
            let Query_cluster = data_array[index].Query_cluster;
            
            y1.unshift(Query_database);
            y2.unshift(Query_user);
            y3.unshift(Query_node_hostname);
            y4.unshift(Query_node_port);
            y5.unshift(Query_process_id);
            y6.unshift(Query_submit_time);
            y7.unshift(Query_cluster);
            y8.unshift(Query_state);
            y9.unshift(Query_elapsedTime);
            y10.unshift(Query_text);
            
            x.push(serial_count++);
        }
        // }
    }

    const result = {
        result: true,
        type: "table",
        contents: {
            length: x.length,
            x,
            ys: [y1, y2, y3, y4, y5, y6, y7, y8,y9,y10],
            infos: [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ]
        }
    };
    if (jsonReq.title) result.contents.title = jsonReq.title;
    return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);

function _getAdditionalQueryParams(jsonReq) {
    const additional_params = {};
    for (const key of Object.keys(jsonReq))
        if (key.startsWith("$qp_")) {
            const paramName = key.substring(4);
            additional_params[`$${paramName}`] = jsonReq[key];
        }
    return additional_params;
}