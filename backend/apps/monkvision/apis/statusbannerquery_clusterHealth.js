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
const utils = require(`${APP_CONSTANTS.LIB_DIR}/utils.js`);

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
    // Calculation
    // Standard deviation
    // const mean = (data_array.reduce((a, b) => a + b)) / data_array.length
    // const stand_dev=Math.sqrt(data_array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data_array.length)
    let total = 0;
    let type_arr = [];
    for (let row of rows) {
        const currentData = JSON.parse(row.raw_data);
        type_arr.push({
            type: currentData.type,
            data: currentData.max_data
        });
        total += currentData.max_data;
    }

    const truePercent = Math.fround(100 - ((total / 300.00) * 100));
    // calculate issue percentage

    const thresh_array = jsonReq["max_threshold"].split(',');
    const max_cpu = parseFloat(thresh_array[0]);
    const max_disk = parseFloat(thresh_array[1]);
    const max_ram = parseFloat(thresh_array[2]);
    let count=0;
    let trigger = false;
    let elseExplanation = "";
    for (let data of type_arr) {
        if ((data.type == "max_cpu") && (data.data > max_cpu)) {
            count +=1;
            elseExplanation += `CPU Threshold breached. Threshold value - ${parseFloat(max_cpu).toFixed(2)}, `
            trigger = true
        }
        if ((data.type == "max_disk") && (data.data > max_disk)) {
            count +=1;
            elseExplanation += `DISK-SPACE Threshold breached. Threshold value - ${parseFloat(max_disk).toFixed(2)}, `
            trigger = true
        }
        if ((data.type == "max_ram") && (data.data > max_ram)) {
            count +=1;
            elseExplanation += `RAM Threshold breached. Threshold value - ${parseFloat(max_ram).toFixed(2)}, `
            trigger = true
        }
    }
    let final_color;
    let font_color;
    if (count == 1) {final_color = "rgb(255, 173, 51)", font_color = "rgb(0,0,0)"}
    if (count == 2) {final_color = "rgb(255, 102, 51)", font_color = "rgb(0,0,0)"}
    if (count == 3) {final_color = "rgb(179, 45, 0)", font_color = "rgb(230, 230, 230)"}

    const ok_colorCode = `percentthresholdColors`,
        ok_iconCode = `percentthresholdIcon`,
        ok_titleCode = `percentthresholdTitle`;


    // set title
    let title = "Status";
    if (trigger == false) title = jsonReq[ok_titleCode];
    else if (jsonReq["elseTitle"]) title = jsonReq["elseTitle"];

    // set icon
    let icon = null;
    if (trigger == false) icon = jsonReq[ok_iconCode];
    else icon = jsonReq["elseIcon"];

    // set color codes based on success percentage
    let fgcolor = "rgb(72,72,72)",
        bgcolor = "white";
    if (trigger == false) {
        fgcolor = jsonReq[ok_colorCode].split(",")[0], bgcolor = jsonReq[ok_colorCode].split(",")[1]
    } else {
        fgcolor = font_color, bgcolor = final_color
    };

    // set explanation text based on success percentage
    let textexplanation = "Cluster Health Unknown";
    if (trigger == false) textexplanation = `Cluster is OK. MAX CPU threshold: ${parseFloat(max_cpu).toFixed(2)}, MAX DISK-SPACE threshold: ${parseFloat(max_disk).toFixed(2)}, MAX RAM threshold: ${parseFloat(max_ram).toFixed(2)}`;
    else textexplanation = elseExplanation.slice(0,-2);

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
            textexplanation
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