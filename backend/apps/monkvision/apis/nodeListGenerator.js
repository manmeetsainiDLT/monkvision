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
 */
exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) {
        LOG.error("Validation failure.");
        return CONSTANTS.FALSE_RESULT;
    }
    const clusterName=(jsonReq.clusterName).toLowerCase().split("-")[0];
    const nodeList_logID="shell_mon__bin_bash_c__home_memsql_monboss_scripts_nodes_list_generator_dashboard_sh__"+clusterName+"_";
    const rowsNodeList = await db.getLogs(nodeList_logID, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    let list=[];
    if (!rowsNodeList) {
        LOG.error("DB read issue for fetching node list");
        return CONSTANTS.FALSE_RESULT;
    }

    for(let key of Object.keys(JSON.parse(rowsNodeList[rowsNodeList.length-1].additional_status).node_id)){
        list.push(key);
    }

    const result = {
        result: true,
        nodeList : list
    };
    return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.timeRange);