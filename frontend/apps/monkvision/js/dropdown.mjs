import {chart_box} from "../components/chart-box/chart-box.mjs"; window.chart_box = chart_box;

async function populateDropdown(clusterTitle, refresh, clusterName) { 
        const api="nodeListGenerator";
        const response = await monkshu_env.components['chart-box']._getContent(api,"clusterName="+clusterName);
        let dropdown = document.querySelector("select#nodeDropdown");         
        let selectedNode=dropdown.getAttribute("selectedNode");
        if(response)
            if(response.nodeList)
                response.nodeList.forEach((item ,index)=> {
                    let options = document.createElement("option"); 
                    options.textContent = item; 
                    options.value = index; 
                    if(item==selectedNode)
                        options.selected=true;
                    dropdown.appendChild(options); 
                });
        dropdown.addEventListener("change", function(){
            router.loadPage('./main.html?dash=./dashboards/dashboard_'+clusterName.split("-")[0]+'.page&title='+clusterTitle+'&refresh='+refresh+'&name='+clusterName+'&nodeID='+dropdown.options[dropdown.selectedIndex].text+'&nodelist=true');
        });
}	

function hideDropdown(clusterName){
    if(!clusterName.includes("Nodes")){
        document.querySelector("label#clusterLabel").style.visibility = 'hidden'; 
        document.querySelector("select#nodeDropdown").style.visibility = 'hidden';
    }
}

export const dropdown = {populateDropdown,hideDropdown};