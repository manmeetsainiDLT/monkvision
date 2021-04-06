/** 
 * Returns status as banner text based on query.
 * 
 * Incoming params
 *  id - The query ID, which is used then to pickup the query from monkvision.json in conf. This
 *       query must return percent column with calculated percentage.
 *  timeRange - The time range for the query
 *  $qa_<something> - The query parameters
 *  percent<number>[Title, Colors, Icon, Explanation] - Title, colors, icons etc. to send back
 *                                                      based on the calculated percentage
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const db = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) {
        LOG.error("Validation failure.");
        return CONSTANTS.FALSE_RESULT;
    }

    const queryParams = _getAdditionalQueryParams(jsonReq);
    const rows = await db.runGetQueryFromID(jsonReq.id, queryParams);
    if (!rows) {
        LOG.error("DB read issue");
        return CONSTANTS.FALSE_RESULT;
    }
    const KBMultiplier = jsonReq.toKBits ? 8 : 1;
    
    // Calculation
    // Standard deviation
    // const mean = (data_array.reduce((a, b) => a + b)) / data_array.length
    // const stand_dev=Math.sqrt(data_array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data_array.length)
    const raw_data = JSON.parse(rows[0].raw_data)
    const propertyToShow = jsonReq.propertyToShow || LOG.error("No property specified that needs to be shown.");
    let final_data={};
    for (let currentData of raw_data){
        if (propertyToShow.includes(currentData.max_property)){
            final_data["max_data"]=currentData.max_data*KBMultiplier;
            final_data["node_hostname"]=currentData.node_hostname;
            final_data["node_port"]=currentData.node_port;
            final_data["max_data_source_device"]=currentData.max_data_source_device;
            final_data["common_name"]=currentData.common_name;
        }
    }
    const truePercent = Math.fround(final_data["max_data"]).toFixed(2);
    // calculate issue percentage
    const threshold = jsonReq["threshold"] || 5.0000;

    // calculate issue percentage
    // const ok_colorCode = `percent${truePercent}Colors`, 
    //     ok_iconCode = `percent${truePercent}Icon`, 
    //     ok_explanationCode = `percent${truePercent}Explanation`, 
    //     ok_titleCode = `percent${truePercent}Title`;

    const ok_colorCode = `percentthresholdColors`,
        ok_iconCode = `percentthresholdIcon`,
        ok_explanationCode = `percentthresholdExplanation`,
        ok_titleCode = `percentthresholdTitle`;


    // set title
    let title = "Status";
    if (parseFloat(threshold) > parseFloat(truePercent)) title = jsonReq[ok_titleCode];
    else if (jsonReq["elseTitle"]) title = jsonReq["elseTitle"];

    // set icon
    let icon = null;
    if (parseFloat(threshold) > parseFloat(truePercent)) icon = jsonReq[ok_iconCode];
    else icon = jsonReq["elseIcon"];

    // set color codes based on success percentage
    let fgcolor = "rgb(72,72,72)",
        bgcolor = "white";
    if (parseFloat(threshold) > parseFloat(truePercent)) {
        fgcolor = jsonReq[ok_colorCode].split(",")[0], bgcolor = jsonReq[ok_colorCode].split(",")[1]
    } else {
        fgcolor = jsonReq["elseColors"].split(",")[0], bgcolor = jsonReq["elseColors"].split(",")[1]
    };

    // set explanation text based on success percentage
    let textexplanation = "Node performance OK";
    if (parseFloat(threshold) > parseFloat(truePercent)) textexplanation = `${final_data.common_name} - ${final_data.node_hostname}:${final_data.node_port}, device - ${final_data.max_data_source_device}, Threshold at: ${threshold}`;
    else textexplanation = `${final_data.common_name} - ${final_data.node_hostname}:${final_data.node_port}, device - ${final_data.max_data_source_device}, Threshold at: ${threshold}`;

    let add_symbol;
    if (!jsonReq.add_symbol) {
        add_symbol = "%"
    } else {
        add_symbol = jsonReq.add_symbol
    }
    const result = {
        result: true,
        type: "metrictext",
        contents: {
            textmain: `${parseFloat(truePercent).toFixed(2)} ${add_symbol}`,
            fgcolor,
            bgcolor,
            textexplanation,
            clusterName: jsonReq.clusterName
        }
    };
    if (title) result.contents.title = title;
    if (icon) result.contents.icon = icon;
    return result;
}

function _getAdditionalQueryParams(jsonReq) {
    const additional_params = {};
    for (const key of Object.keys(jsonReq))
        if (key.startsWith("$qp_")) {
            const paramName = key.substring(4);
            additional_params[`$${paramName}`] = jsonReq[key];
        }
    return additional_params;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.timeRange);

const _forLoopMinMax = (array) => {
    let min = array[0],
        max = array[0]

    for (let i = 1; i < array.length; i++) {
        let value = array[i]
        min = (value < min) ? value : min
        max = (value > max) ? value : max
    }

    return [min, max]
}