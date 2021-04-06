/**
 * Returns MonBoss or CyberWarrior log file's status as banner text.
 *
 * (C) 2020 TekMonks. All rights reserved.
 */

const db = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);
const utils = require(`${APP_CONSTANTS.LIB_DIR}/utils.js`);

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) {
        LOG.error("Validation failure for statusbanner_activeNodes.js. LogID - " + jsonReq.params);
        return CONSTANTS.FALSE_RESULT;
    }

    const rows = await db.getLogs(jsonReq.id, utils.getTimeRangeForSQLite(JSON.parse(jsonReq.timeRange)));
    if (!rows) {
        LOG.error("DB read issue");
        return CONSTANTS.FALSE_RESULT;
    }
    let numTrue = 0,
        numFalse = 0,
        parsed_row = {};
    // for (const row of rows) {
    row = rows[rows.length - 1];
    parsed_row = JSON.parse(row.additional_status);
    const percentColors_autofilled = `percent${Object.keys(parsed_row).length-2}Colors`
    const percentExplanation_autofilled = `percent${Object.keys(parsed_row).length-2}Explanation`

    Object.defineProperty(jsonReq, percentColors_autofilled,
        Object.getOwnPropertyDescriptor(jsonReq, "percent_total_nodes_Colors"));
    Object.defineProperty(jsonReq, percentExplanation_autofilled,
        Object.getOwnPropertyDescriptor(jsonReq, "percent_total_nodes_Explanation"));
    delete jsonReq["percent_total_nodes_Colors"];
    delete jsonReq["percent_total_nodes_Explanation"];

    numTrue = parsed_row.total_active_nodes;
    // calculate active nodes
    const truePercent = numTrue,
        colorCode = `percent${(truePercent)}Colors`,
        iconCode = `percent${(truePercent)}Icon`,
        explanationCode = `percent${(truePercent)}Explanation`,
        titleCode = `percent${(truePercent)}Title`;

    // set title
    let title = null;
    if (jsonReq[titleCode]) title = jsonReq[titleCode];
    else if (jsonReq["elseTitle"]) title = jsonReq["elseTitle"];

    // set icon
    let icon = null;
    if (jsonReq[iconCode]) icon = jsonReq[iconCode];
    else if (jsonReq["elseIcon"]) icon = jsonReq["elseIcon"];;

    // set color codes based on success percentage
    let fgcolor = "rgb(72,72,72)",
        bgcolor = "white";
    if (jsonReq[colorCode]) {
        fgcolor = jsonReq[colorCode].split(",")[0], bgcolor = jsonReq[colorCode].split(",")[1]
    } else if (jsonReq["elseColors"]) {
        fgcolor = jsonReq["elseColors"].split(",")[0], bgcolor = jsonReq["elseColors"].split(",")[1]
    };

    // set explanation text based on success percentage
    let textexplanation = "Percent true";
    if (jsonReq[explanationCode]) textexplanation = jsonReq[explanationCode];
    else if (jsonReq["elseExplanation"]) textexplanation = jsonReq["elseExplanation"];

    const result = {
        result: true,
        type: "metrictext",
        contents: {
            textmain: `${numTrue}`,
            fgcolor,
            bgcolor,
            textexplanation
        }
    };
    if (title) result.contents.title = title;
    if (icon) result.contents.icon = icon;
    return result;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);